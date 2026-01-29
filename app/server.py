import os
import logging
from datetime import datetime
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import shutil

from app.core.config import MODEL_NAME, EMBEDDING_DIM, HOST, PORT, DB_PATH, INDEX_PATH
from app.core import database, parsing
from app.core.engine import VectorEngine
from app.ingest import ingest_github

# ============================================================================
# LOGGING & STATE
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# Simple in-memory state for the latest ingestion job
ingest_status = {
    "is_ingesting": False,
    "current_file": "",
    "progress": 0,
    "total": 0,
    "message": "Idle",
    "error": None,
    "history": []
}

def update_status(message: str, current: int = 0, total: int = 0, error: str = None, is_ingesting: bool = True):
    ingest_status["message"] = message
    ingest_status["progress"] = current
    ingest_status["total"] = total
    ingest_status["is_ingesting"] = is_ingesting
    if error:
        ingest_status["error"] = error
        ingest_status["is_ingesting"] = False
    
    # Log important updates
    if error:
        logger.error(f"Ingest Error: {error}")
    elif message:
        logger.info(f"Ingest Status: {message} ({current}/{total})")

def run_ingest_background(repo_url: str, subpath: str, pattern: str):
    """
    Wrapper to run ingestion with status updates.
    """
    try:
        update_status(f"Starting clone of {repo_url}...", is_ingesting=True)
        
        # Define a callback to receive updates from ingest.py
        def progress_callback(msg, current, total, error=None):
            update_status(msg, current, total, error, is_ingesting=True)
            
        ingest_github(
            repo_url=repo_url, 
            subpath=subpath, 
            pattern=pattern, 
            callback=progress_callback
        )
        
        update_status("Ingestion complete", ingest_status["progress"], ingest_status["total"], is_ingesting=False)
        ingest_status["history"].append(f"Success: {repo_url} at {datetime.now()}")
        
    except Exception as e:
        logger.exception("Background ingestion failed")
        update_status("Failed", error=str(e), is_ingesting=False)
        ingest_status["history"].append(f"Failed: {repo_url} - {str(e)}")

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class IngestRequest(BaseModel):
    text: str
    metadata: Optional[str] = None

class GithubIngestRequest(BaseModel):
    url: str
    subpath: Optional[str] = ""
    pattern: Optional[str] = "**/*.md"

class SearchRequest(BaseModel):
    query: str
    k: int = 5

class SearchResult(BaseModel):
    id: int
    score: float
    content: str
    metadata: Optional[str]

# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(title="RAG Search System", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global engine instance
engine: Optional[VectorEngine] = None

@app.on_event("startup")
def startup():
    """Initialize resources on startup"""
    global engine
    database.init_db()
    engine = VectorEngine()
    logger.info(
        f"System ready. Documents in DB: {database.get_document_count()}, Vectors in FAISS: {engine.get_total_vectors()}"
    )

@app.on_event("shutdown")
def shutdown():
    """Save index on shutdown"""
    if engine:
        engine.save()
        logger.info("Index saved.")

@app.post("/ingest")
def ingest_document(request: IngestRequest):
    """
    Ingest a raw text document.
    """
    logger.info("Received manual text ingestion request")
    # 1. Generate embedding
    vector = engine.embed(request.text)

    # 2. Save to SQLite (get ID)
    doc_id = database.insert_document(request.text, request.metadata)

    # 3. Add to FAISS
    engine.add_to_index(vector)

    return {
        "status": "success",
        "id": doc_id,
        "message": f"Document indexed with ID {doc_id}",
    }

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Upload and ingest a file.
    """
    filename = file.filename
    logger.info(f"Received upload request: {filename}")
    content_bytes = await file.read()
    
    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Could not decode file as UTF-8. Only text files are currently supported.")

    # Parse based on extension
    if filename.endswith(".md"):
        content_str = parsing.parse_markdown(content_str)
    elif filename.endswith(".html"):
        content_str = parsing.parse_html(content_str)
    
    content_str = parsing.clean_text(content_str)
    
    if not content_str:
        return {"status": "skipped", "message": "File is empty"}

    chunks = parsing.chunk_text(content_str)
    
    count = 0
    for i, chunk in enumerate(chunks):
        metadata = f"{filename}#chunk{i+1}"
        vector = engine.embed(chunk)
        database.insert_document(chunk, metadata)
        engine.add_to_index(vector)
        count += 1

    logger.info(f"Processed {filename}: {count} chunks")
    return {
        "status": "success",
        "chunks_ingested": count,
        "filename": filename
    }

@app.post("/ingest/github")
def ingest_github_repo(request: GithubIngestRequest, background_tasks: BackgroundTasks):
    """
    Ingest a GitHub repository in the background.
    """
    if ingest_status["is_ingesting"]:
        raise HTTPException(status_code=400, detail="An ingestion job is already running")

    background_tasks.add_task(
        run_ingest_background, 
        repo_url=request.url, 
        subpath=request.subpath, 
        pattern=request.pattern
    )
    return {"status": "started", "message": f"Cloning and ingesting {request.url} in the background..."}

@app.get("/ingest/status")
def get_ingest_status():
    """Get the status of the current/last ingestion job"""
    return ingest_status

@app.get("/documents")
def list_documents():
    """
    List all unique documents in the system.
    """
    all_metadata = database.get_all_metadata()
    files = {}
    
    for m in all_metadata:
        if not m: 
            continue
        # Metadata format: filename#chunkN
        name = m.split('#')[0]
        files[name] = files.get(name, 0) + 1
        
    return [
        {"name": name, "chunks": count, "status": "indexed"}
        for name, count in files.items()
    ]

@app.post("/search", response_model=List[SearchResult])
def search(request: SearchRequest):
    """
    Search for documents similar to the query.
    """
    if engine.get_total_vectors() == 0:
        return []

    # 1. Vectorize query
    query_vector = engine.embed(request.query)

    # 2. Search FAISS for top-k indices
    top_indices, scores = engine.search(query_vector, request.k)

    # 3. Fetch documents from SQLite
    # Convert FAISS indices to SQLite IDs (1-indexed)
    valid_ids = [int(idx) + 1 for idx in top_indices if idx != -1]

    if not valid_ids:
        return []

    documents = database.fetch_documents_by_ids(valid_ids)

    # 4. Combine scores with documents
    doc_map = {doc["id"]: doc for doc in documents}

    results = []
    for idx, score in zip(top_indices, scores):
        if idx == -1:
            continue
        doc_id = int(idx) + 1
        if doc_id in doc_map:
            doc = doc_map[doc_id]
            results.append(
                SearchResult(
                    id=doc["id"],
                    score=float(score),
                    content=doc["content"],
                    metadata=doc["metadata"],
                )
            )

    return results

@app.get("/stats")
def get_stats():
    """Get system statistics"""
    return {
        "total_documents": database.get_document_count(),
        "total_vectors": engine.get_total_vectors(),
        "model": MODEL_NAME,
        "dimension": EMBEDDING_DIM,
        "index_type": "IndexFlatIP (Cosine Similarity)",
    }

@app.delete("/reset")
def reset_system():
    """WARNING: Deletes all data and resets the system"""
    global engine

    # Delete database
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)

    # Delete index
    if os.path.exists(INDEX_PATH):
        os.remove(INDEX_PATH)

    # Reinitialize
    database.init_db()
    engine = VectorEngine()

    return {"status": "System reset successfully"}

if __name__ == "__main__":
    uvicorn.run(app, host=HOST, port=PORT)