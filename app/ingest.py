"""
Script to ingest open source documentation into the RAG system.
Supports: Markdown files, text files, HTML docs, and more.
"""

import requests
import os
import glob
from pathlib import Path
from typing import List
import time
from bs4 import BeautifulSoup
import re
import gc
import shutil
import tempfile
import subprocess
import logging

# ============================================================================
# CONFIGURATION
# ============================================================================

logger = logging.getLogger(__name__)

RAG_API_URL = "http://localhost:8000"
CHUNK_SIZE = 300  # Characters per chunk
CHUNK_OVERLAP = 50  # Overlap between chunks

# ============================================================================
# TEXT CHUNKING
# ============================================================================

def chunk_text(
    text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP
) -> List[str]:
    """
    Split text into overlapping chunks.
    This prevents context loss at chunk boundaries.
    """
    if not text:
        return []
        
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))

        # Try to break at sentence boundary
        if end < len(text):
            search_start = max(0, chunk_size // 2) 
            text_slice = text[start:end]
            
            for punct in [". ", "! ", "? ", "\n\n"]:
                last_punct = text_slice.rfind(punct, search_start)
                if last_punct != -1:
                    end = start + last_punct + len(punct)
                    break
            
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        next_start = end - overlap
        if next_start <= start:
            next_start = start + max(1, chunk_size - overlap)
            
        start = next_start

    return chunks

# ============================================================================
# FILE READERS
# ============================================================================

def read_markdown_file(filepath: str) -> str:
    """Read and clean markdown file"""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    # Remove front matter (YAML)
    content = re.sub(r"^---\n.*?\n---\n", "", content, flags=re.DOTALL)
    return content

def read_text_file(filepath: str) -> str:
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()

def read_html_file(filepath: str) -> str:
    with open(filepath, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")
    for script in soup(["script", "style", "nav", "footer"]):
        script.decompose()
    return soup.get_text(separator="\n", strip=True)

def download_webpage(url: str) -> str:
    response = requests.get(url)
    response.raise_for_status()
    soup = BeautifulSoup(response.content, "html.parser")
    for script in soup(["script", "style", "nav", "footer", "header"]):
        script.decompose()
    return soup.get_text(separator="\n", strip=True)

# ============================================================================
# INGESTION FUNCTIONS
# ============================================================================

def ingest_text(text: str, metadata: str = None) -> dict:
    response = requests.post(
        f"{RAG_API_URL}/ingest", json={"text": text, "metadata": metadata}
    )
    return response.json()

def ingest_file(filepath: str, callback=None):
    logger.info(f"Processing: {filepath}")

    ext = Path(filepath).suffix.lower()

    if ext in [".md", ".markdown"]:
        content = read_markdown_file(filepath)
    elif ext in [".txt", ".rst"]:
        content = read_text_file(filepath)
    elif ext in [".html", ".htm"]:
        content = read_html_file(filepath)
    else:
        logger.warning(f"  ⚠️  Skipping unsupported file type: {ext}")
        return 0

    content = re.sub(r"\n{3,}", "\n\n", content)
    content = content.strip()

    if not content:
        logger.warning(f"  ⚠️  Empty file, skipping")
        return 0

    chunks = chunk_text(content)
    logger.info(f"  📄 Split into {len(chunks)} chunks")

    ingested = 0
    for i, chunk in enumerate(chunks):
        metadata = f"{filepath}#chunk{i+1}"
        try:
            ingest_text(chunk, metadata)
            ingested += 1
        except Exception as e:
            logger.error(f"  ❌ Error ingesting chunk {i+1}: {e}")

    logger.info(f"  ✅ Ingested {ingested}/{len(chunks)} chunks")
    return ingested

def ingest_directory(directory: str, pattern: str = "**/*.md", max_files: int = None, callback=None):
    logger.info(f"\n🔍 Scanning directory: {directory}")
    logger.info(f"Pattern: {pattern}")
    
    if callback:
        callback(f"Scanning directory: {directory}", 0, 0)

    files = glob.glob(os.path.join(directory, pattern), recursive=True)

    if not files:
        logger.warning("❌ No files found!")
        if callback:
            callback("No files found", 0, 0, error="No files found matching pattern")
        return

    if max_files:
        files = files[:max_files]
        logger.info(f"Found {len(files)} files (limited to {max_files})")
    else:
        logger.info(f"Found {len(files)} files")

    total_chunks = 0
    failed_files = 0
    start_time = time.time()
    total_files = len(files)

    for idx, filepath in enumerate(files, 1):
        if callback:
            callback(f"Processing {os.path.basename(filepath)}", idx, total_files)
            
        logger.info(f"[{idx}/{total_files}] Processing {filepath}")
        try:
            chunks = ingest_file(filepath, callback)
            total_chunks += chunks
        except requests.exceptions.ConnectionError:
            logger.error(f"  ❌ Cannot connect to RAG server at {RAG_API_URL}")
            if callback:
                callback("Connection error", idx, total_files, error="Cannot connect to RAG server")
            return
        except Exception as e:
            logger.error(f"  ❌ Failed: {e}")
            failed_files += 1

        if idx % 10 == 0:
            gc.collect()
            time.sleep(0.2)
        else:
            time.sleep(0.05)

        if idx % 50 == 0:
            elapsed = time.time() - start_time
            logger.info(f"  ⏱️  Progress: {idx}/{total_files} files | {total_chunks} chunks")
            gc.collect()

    elapsed = time.time() - start_time
    logger.info(f"✅ COMPLETE")
    logger.info(f"Files processed: {total_files - failed_files}/{total_files}")
    logger.info(f"Total chunks ingested: {total_chunks}")
    logger.info(f"Time elapsed: {elapsed:.2f}s")

def ingest_urls(urls: List[str]):
    print(f"\n🌐 Downloading {len(urls)} webpages\n")
    total_chunks = 0
    for url in urls:
        print(f"Processing: {url}")
        try:
            content = download_webpage(url)
            chunks = chunk_text(content)
            print(f"  📄 Split into {len(chunks)} chunks")
            for i, chunk in enumerate(chunks):
                metadata = f"{url}#chunk{i+1}"
                ingest_text(chunk, metadata)
                total_chunks += 1
            print(f"  ✅ Ingested {len(chunks)} chunks\n")
            time.sleep(0.5)
        except Exception as e:
            print(f"  ❌ Error: {e}\n")
    print(f"\n✅ Total chunks ingested: {total_chunks}\n")

def ingest_github(repo_url: str, subpath: str = "", pattern: str = "**/*.md", max_files: int = None, callback=None):
    """
    Clones a GitHub repository and ingests files from it.
    """
    logger.info(f"\n🚀 Cloning repository: {repo_url}")
    if callback:
        callback(f"Cloning {repo_url}...", 0, 0)
    
    try:
        # Create a temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Clone the repository
            process = subprocess.Popen(
                ["git", "clone", "--depth", "1", repo_url, temp_dir],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = process.communicate()
            
            if process.returncode != 0:
                error_msg = stderr.decode("utf-8")
                logger.error(f"Git clone failed: {error_msg}")
                if callback:
                    callback("Clone failed", 0, 0, error=f"Git clone failed: {error_msg}")
                return

            target_dir = os.path.join(temp_dir, subpath)
            if not os.path.exists(target_dir):
                logger.error(f"❌ Subpath '{subpath}' does not exist in the repository.")
                if callback:
                    callback(f"Subpath '{subpath}' not found", 0, 0, error=f"Folder '{subpath}' not found in repo")
                return

            logger.info(f"📂 Processing directory: {subpath if subpath else 'root'}")
            ingest_directory(target_dir, pattern, max_files, callback)
            
    except Exception as e:
        logger.exception("An error occurred during GitHub ingestion")
        if callback:
            callback("System error", 0, 0, error=str(e))

if __name__ == "__main__":
    import sys
    print("\n" + "=" * 60)
    print("📚 RAG Documentation Ingestion Tool")
    print("=" * 60)

    if len(sys.argv) < 2:
        print("\nUsage:")
        print("  python app/ingest.py <directory>")
        print("  python app/ingest.py <directory> **/*.md")
        sys.exit(1)

    if sys.argv[1] == "--url":
        if len(sys.argv) < 3:
            print("❌ Please provide a URL")
            sys.exit(1)
        ingest_urls([sys.argv[2]])
    elif sys.argv[1] == "--github":
        if len(sys.argv) < 3:
            print("❌ Please provide a GitHub repository URL")
            print("Usage: python app/ingest.py --github <repo_url> [subpath] [pattern]")
            sys.exit(1)
        
        repo_url = sys.argv[2]
        subpath = sys.argv[3] if len(sys.argv) > 3 else ""
        pattern = sys.argv[4] if len(sys.argv) > 4 else "**/*.md"
        
        ingest_github(repo_url, subpath, pattern)
    else:
        directory = sys.argv[1]
        pattern = sys.argv[2] if len(sys.argv) > 2 else "**/*.md"
        max_files = int(sys.argv[3]) if len(sys.argv) > 3 else None
        ingest_directory(directory, pattern, max_files)
