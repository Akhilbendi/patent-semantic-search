# Patent Semantic Search

A semantic patent search application that enables users to search approximately 10,000 patent records using natural-language queries.

The application uses transformer-based semantic embeddings and FAISS similarity search to retrieve patents based on meaning rather than relying only on exact keyword matching.

## Live Application

**Frontend:**  
https://patent-semantic-search.netlify.app

**Backend API:**  
https://patent-semantic-search-api.onrender.com

**API Documentation:**  
https://patent-semantic-search-api.onrender.com/docs

## Source Code

**GitHub Repository:**  
https://github.com/Akhilbendi/patent-semantic-search

---

## Key Features

- Natural-language semantic patent search
- Search across approximately 10,000 patent records
- Title, Abstract, and Claims used for semantic retrieval
- Sentence Transformer embeddings using `all-MiniLM-L6-v2`
- FAISS exact vector similarity search
- Normalized embeddings with cosine-similarity equivalent scoring
- Configurable minimum relevance threshold
- Maximum Top 20 results
- Relevance score displayed for each result
- `N/A` returned when no result meets the selected threshold
- Individual patent detail pages
- Patent title, abstract, and claims available from the result view
- Responsive interface for desktop and mobile devices

---

## System Architecture

The application is implemented as a two-tier web architecture consisting of a lightweight React frontend and a Python-based semantic search backend.

The frontend is responsible for the user interface and search interaction, while the backend handles query processing, semantic embedding generation, vector retrieval, relevance filtering, and patent metadata retrieval.

### High-Level Architecture

```text
                              USER
                               │
                               │ Search Query
                               ▼
                    ┌─────────────────────┐
                    │   React + Vite      │
                    │     Frontend        │
                    │                     │
                    │ • Search interface  │
                    │ • Threshold control │
                    │ • Result display    │
                    │ • Patent details    │
                    └──────────┬──────────┘
                               │
                               │ HTTPS REST API
                               ▼
                    ┌─────────────────────┐
                    │      FastAPI        │
                    │      Backend        │
                    │                     │
                    │  API Layer          │
                    │  /health            │
                    │  /search            │
                    │  /patent/{id}       │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼───────────────┐
                │              │               │
                ▼              ▼               ▼
       ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
       │ Query        │ │ FAISS Vector │ │ Patent       │
       │ Embedding    │ │ Index        │ │ Metadata     │
       │              │ │              │ │              │
       │ MiniLM       │ │ IndexFlatIP  │ │ Publication  │
       │ Model        │ │              │ │ Title        │
       └──────┬───────┘ └──────┬───────┘ │ Abstract     │
              │                │         │ Claims       │
              │                │         └──────────────┘
              │                │
              └───────┬────────┘
                      │
                      ▼
              Similarity Scores
                      │
                      ▼
              Relevance Threshold
                   (0.35)
                      │
                      ▼
                 Top 20 Results
                      │
                      ▼
                 React Frontend
