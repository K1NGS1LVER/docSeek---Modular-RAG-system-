#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")"

# Activate venv just in case, or use direct path
PYTHON=".venv/bin/python"

if [ ! -f "$PYTHON" ]; then
    echo "Error: Virtual environment not found at .venv"
    exit 1
fi

echo "Starting RAG Server..."
echo "  - Model: all-mpnet-base-v2"
echo "  - Data: ./data/"
echo ""

# Run the server module
$PYTHON -m app.server
