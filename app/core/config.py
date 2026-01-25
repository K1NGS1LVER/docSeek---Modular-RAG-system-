import os
from pathlib import Path

# Base directory is the parent of 'app' (i.e., project_root)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)

# File Paths
DB_PATH = str(DATA_DIR / "docs.db")
INDEX_PATH = str(DATA_DIR / "my_index.faiss")

# Settings
MODEL_NAME = "all-mpnet-base-v2"
EMBEDDING_DIM = 768  # Matches mpnet
# MODEL_NAME = "all-MiniLM-L6-v2"
# EMBEDDING_DIM = 384 

# Server settings
HOST = "0.0.0.0"
PORT = 8000

# Environment setup
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
