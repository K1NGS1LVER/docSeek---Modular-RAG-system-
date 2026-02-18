# Module Flow Documentation

This document visualizes the control flow and architecture of the docSeek system using Mermaid diagrams.

## 1. System Architecture Overview

High-level interaction between Frontend, Backend API, Vector Engine, and Persistence layers.

```mermaid
graph TD
    subgraph "Frontend (React)"
        UI[User Interface]
        API_Client[API Client / Fetch]
    end

    subgraph "Backend (FastAPI)"
        Server[server.py]
        Ingest[ingest.py]
        
        subgraph "Core Logic"
            Parsing[parsing.py]
            Engine[engine.py]
            DB_Mod[database.py]
        end
    end

    subgraph "Persistence"
        FAISS[(FAISS Index)]
        SQLite[(SQLite DB)]
        Files[File System]
    end

    UI -->|Requests| API_Client
    API_Client <-->|JSON/HTTP| Server
    
    Server --> Parsing
    Server --> Engine
    Server --> DB_Mod
    
    Ingest --> Server
    Ingest -->|Direct Import| Parsing
    
    Engine <-->|Read/Write| FAISS
    DB_Mod <-->|Read/Write| SQLite
```

## 2. Ingestion Workflow (Sequence Diagram)

This flow details how a file (uploaded or from GitHub) is processed, chunked, embedded, and stored.

```mermaid
sequenceDiagram
    participant Client
    participant Server as server.py
    participant Parser as parsing.py
    participant Engine as engine.py (VectorEngine)
    participant DB as database.py
    participant FAISS as FAISS Index

    Note over Client, Server: Scenario: POST /upload or /ingest/github

    Client->>Server: Send File / Repo URL
    
    rect rgb(240, 240, 240)
        Note right of Server: Processing Loop
        Server->>Parser: parse_markdown() / parse_html()
        Parser-->>Server: Clean Text
        Server->>Parser: chunk_text()
        Parser-->>Server: List[Chunks]
    end

    loop For Each Chunk
        Server->>Engine: embed(chunk)
        activate Engine
        Engine->>Engine: SentenceTransformer.encode()
        Engine-->>Server: Vector (np.ndarray)
        deactivate Engine

        Server->>DB: insert_document(chunk, metadata)
        activate DB
        DB->>DB: INSERT INTO documents
        DB-->>Server: doc_id
        deactivate DB

        Server->>Engine: add_to_index(vector)
        activate Engine
        Engine->>FAISS: index.add(vector)
        deactivate Engine
    end
    
    Server-->>Client: {status: "success", count: N}
```

## 3. Search Workflow (Sequence Diagram)

This flow illustrates how a user query is transformed into a vector and used to retrieve semantic matches.

```mermaid
sequenceDiagram
    participant Client
    participant Server as server.py
    participant Engine as engine.py (VectorEngine)
    participant DB as database.py
    participant FAISS as FAISS Index

    Client->>Server: POST /search {query: "..."}
    
    Server->>Engine: embed(query)
    Engine-->>Server: query_vector

    Server->>Engine: search(query_vector, k=5)
    activate Engine
    Engine->>FAISS: index.search()
    FAISS-->>Engine: indices, scores
    Engine-->>Server: top_indices, scores
    deactivate Engine

    Server->>DB: fetch_documents_by_ids(valid_ids)
    activate DB
    DB->>DB: SELECT ... WHERE id IN (...)
    DB-->>Server: List[Documents]
    deactivate DB

    Server->>Server: Merge scores with Doc Content
    Server-->>Client: List[SearchResult]
```

## 4. Frontend Component Flow

Visualizes the user journey within the React application.

```mermaid
flowchart LR
    Start((User Visits)) --> Landing[Landing Page]
    
    Landing -->|Click 'Get Started'| Dashboard
    
    subgraph Dashboard Page
        direction TB
        Nav[Navbar]
        Tabs{User Action}
        
        Tabs -->|Upload| UploadForm[Upload File]
        Tabs -->|Search| SearchBar[Search Input]
        
        UploadForm -->|POST /upload| API_Ingest
        SearchBar -->|POST /search| API_Search
        
        API_Ingest -->|Update| DocList[Document List]
        API_Search -->|Result| ResultsArea[Search Results]
    end
```
