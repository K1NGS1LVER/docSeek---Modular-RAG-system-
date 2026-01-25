import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn

from app.core.config import MODEL_NAME, EMBEDDING_DIM, HOST, PORT, DB_PATH, INDEX_PATH
from app.core import database
from app.core.engine import VectorEngine

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class IngestRequest(BaseModel):
    text: str
    metadata: Optional[str] = None

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

# Global engine instance
engine: Optional[VectorEngine] = None

@app.on_event("startup")
def startup():
    """Initialize resources on startup"""
    global engine
    database.init_db()
    engine = VectorEngine()
    print(
        f"System ready. Documents in DB: {database.get_document_count()}, Vectors in FAISS: {engine.get_total_vectors()}"
    )

@app.on_event("shutdown")
def shutdown():
    """Save index on shutdown"""
    if engine:
        engine.save()

@app.post("/ingest")
def ingest_document(request: IngestRequest):
    """
    Ingest a document into the system.
    Returns the document ID.
    """
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

@app.post("/search", response_model=List[SearchResult])
def search(request: SearchRequest):
    """
    Search for documents similar to the query.
    Returns top-k results with scores.
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
