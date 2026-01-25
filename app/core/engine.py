import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from .config import MODEL_NAME, EMBEDDING_DIM, INDEX_PATH

class VectorEngine:
    """Manages embeddings and FAISS index"""

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
            print("Creating new FAISS index (IndexFlatIP for cosine similarity)")
            self.index = faiss.IndexFlatIP(self.dimension)

    def embed(self, text: str) -> np.ndarray:
        """Generate normalized embedding for text"""
        embedding = self.model.encode(text, convert_to_numpy=True)
        # Normalize for cosine similarity via inner product
        embedding = embedding.reshape(1, -1).astype("float32")
        faiss.normalize_L2(embedding)
        return embedding

    def add_to_index(self, vectors: np.ndarray):
        """Add vectors to FAISS index"""
        vectors = vectors.astype("float32")
        faiss.normalize_L2(vectors)
        self.index.add(vectors)
        
        # Auto-save every 50 vectors
        if self.index.ntotal % 50 == 0:
            self.save()

    def search(self, query_vector: np.ndarray, k: int = 5):
        """Search for top-k nearest neighbors"""
        query_vector = query_vector.astype("float32")
        distances, indices = self.index.search(query_vector, k)
        return indices[0], distances[0]

    def save(self):
        """Persist index to disk"""
        faiss.write_index(self.index, self.index_path)
        print(f"Index saved to {self.index_path}")

    def get_total_vectors(self) -> int:
        """Get count of vectors in index"""
        return self.index.ntotal
