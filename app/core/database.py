import sqlite3
from contextlib import contextmanager
from typing import List, Optional, Dict, Any
from .config import DB_PATH

@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = sqlite3.connect(DB_PATH)
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    """Initialize SQLite database"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """
        )
        conn.commit()
    print(f"Database initialized at {DB_PATH}")

def insert_document(content: str, metadata: Optional[str] = None) -> int:
    """Insert document and return its ID"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO documents (content, metadata) VALUES (?, ?)",
            (content, metadata),
        )
        doc_id = cursor.lastrowid
        conn.commit()
    return doc_id

def fetch_documents_by_ids(doc_ids: List[int]) -> List[Dict[str, Any]]:
    """Fetch documents by their IDs"""
    if not doc_ids:
        return []

    with get_db() as conn:
        cursor = conn.cursor()
        placeholders = ",".join("?" * len(doc_ids))
        cursor.execute(
            f"SELECT id, content, metadata FROM documents WHERE id IN ({placeholders})",
            doc_ids,
        )
        rows = cursor.fetchall()

    return [{"id": row[0], "content": row[1], "metadata": row[2]} for row in rows]

def get_document_count() -> int:
    """Get total number of documents"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM documents")
        return cursor.fetchone()[0]

def get_all_metadata() -> List[str]:
    """Get metadata for all documents to identify unique files"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT metadata FROM documents WHERE metadata IS NOT NULL")
        rows = cursor.fetchall()
    return [row[0] for row in rows]

def get_all_documents() -> List[Dict[str, Any]]:
    """Fetch all documents (for index rebuilding)"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, content, metadata FROM documents")
        rows = cursor.fetchall()
    return [{"id": row[0], "content": row[1], "metadata": row[2]} for row in rows]
