import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from .config import MODEL_NAME, EMBEDDING_DIM, INDEX_PATH

class VectorEngine:
    """Manages embeddings and FAISS index with explicit ID mapping"""

    def __init__(self):
        print(f"Loading model: {MODEL_NAME}...")
        self.model = SentenceTransformer(MODEL_NAME)
        self.dimension = EMBEDDING_DIM
        self.index_path = INDEX_PATH

        # Load existing index or create new one
        if os.path.exists(self.index_path):
            print(f"Loading existing FAISS index from {self.index_path}")
            self.index = faiss.read_index(self.index_path)
        else:
            print("Creating new FAISS index (IndexIDMap + IndexFlatIP for cosine similarity)")
            base_index = faiss.IndexFlatIP(self.dimension)
            self.index = faiss.IndexIDMap(base_index)

    def embed(self, text: str) -> np.ndarray:
        """Generate normalized embedding for text"""
        embedding = self.model.encode(text, convert_to_numpy=True)
        # Normalize for cosine similarity via inner product
        embedding = embedding.reshape(1, -1).astype("float32")
        faiss.normalize_L2(embedding)
        return embedding
    
    def embed_batch(self, texts: list) -> np.ndarray:
        """Generate normalized embeddings for multiple texts at once (MUCH faster)"""
        if not texts:
            return np.array([])
        
        # Batch encode all texts at once
        embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        embeddings = embeddings.astype("float32")
        
        # Normalize all embeddings
        faiss.normalize_L2(embeddings)
        return embeddings

    def add_to_index(self, vectors: np.ndarray, doc_ids: list = None):
        """Add vectors to FAISS index with explicit document IDs"""
        if vectors.ndim == 1:
            vectors = vectors.reshape(1, -1)
        
        vectors = vectors.astype("float32")
        
        if doc_ids is not None:
            ids = np.array(doc_ids, dtype=np.int64)
        else:
            # Fallback: auto-assign sequential IDs starting from current total
            start_id = self.index.ntotal + 1
            ids = np.arange(start_id, start_id + vectors.shape[0], dtype=np.int64)
        
        self.index.add_with_ids(vectors, ids)
        
        # Auto-save every 50 vectors
        if self.index.ntotal % 50 == 0:
            self.save()

    def search(self, query_vector: np.ndarray, k: int = 5):
        """Search for top-k nearest neighbors. Returns (doc_ids, scores)."""
        query_vector = query_vector.astype("float32")
        distances, indices = self.index.search(query_vector, k)
        # indices now contain actual doc IDs (not sequential positions)
        return indices[0], distances[0]

    def save(self):
        """Persist index to disk"""
        faiss.write_index(self.index, self.index_path)
        print(f"Index saved to {self.index_path}")

    def get_total_vectors(self) -> int:
        """Get count of vectors in index"""
        return self.index.ntotal
