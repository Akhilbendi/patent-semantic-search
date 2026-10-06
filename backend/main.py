import gzip, json, os, re, html
from pathlib import Path
from typing import Optional

import faiss
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastembed import TextEmbedding

BASE = Path(__file__).resolve().parent
DATA_DIR = BASE / "data"
INDEX_PATH = DATA_DIR / "patent_search_semantic.faiss"
META_PATH = DATA_DIR / "patent_backend_data.json.gz"
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
TOP_K = 20
DEFAULT_THRESHOLD = 0.35

app = FastAPI(title="Patent Semantic Search API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=False,
    allow_methods=["*"], allow_headers=["*"],
)

index = None
records = None
by_publication = None
embedder = None

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    threshold: float = Field(DEFAULT_THRESHOLD, ge=0.0, le=1.0)
    top_k: int = Field(TOP_K, ge=1, le=TOP_K)

def clean_text(text: str) -> str:
    text = html.unescape(str(text or ""))
    text = re.sub(r"_x000D_|<br\s*/?>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"[\r\n\t]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def load_records():
    global records, by_publication
    if records is not None:
        return
    rows = []
    with gzip.open(META_PATH, "rt", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                rows.append(json.loads(line))
    records = rows
    by_publication = {str(r["Publication Number"]): r for r in rows}

def load_index():
    global index
    if index is None:
        index = faiss.read_index(str(INDEX_PATH))
    return index

def load_model():
    global embedder
    if embedder is None:
        # FastEmbed uses an ONNX Runtime implementation of the same
        # sentence-transformers/all-MiniLM-L6-v2 model, avoiding PyTorch.
        embedder = TextEmbedding(model_name=MODEL_NAME, threads=1)
    return embedder

@app.on_event("startup")
def startup():
    load_records()
    load_index()

@app.get("/")
def root():
    return {"service": "Patent Semantic Search API", "status": "ok"}

@app.get("/health")
def health():
    load_records(); load_index()
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "records": len(records),
        "indexed_vectors": int(index.ntotal),
        "threshold": DEFAULT_THRESHOLD,
        "embedding_dimension": int(index.d),
    }

@app.post("/search")
def search(req: SearchRequest):
    load_records(); load_index(); model = load_model()
    query = clean_text(req.query)
    if not query:
        return {"results": [], "message": "N/A"}

    q = np.asarray(list(model.embed([query]))[0], dtype="float32").reshape(1, -1)
    # FastEmbed returns normalized embeddings for this model; normalize again
    # to guarantee cosine-equivalent inner product with the FAISS index.
    faiss.normalize_L2(q)
    scores, ids = index.search(q, index.ntotal)

    out = []
    for score, idx in zip(scores[0], ids[0]):
        if idx < 0 or float(score) < req.threshold:
            continue
        r = records[int(idx)]
        out.append({
            "rank": len(out) + 1,
            "publication_number": str(r["Publication Number"]),
            "title": clean_text(r.get("Title (Translated)(English)", "")),
            "relevance_score": round(float(score), 4),
        })
        if len(out) >= req.top_k:
            break
    return {"results": out, "message": "N/A" if not out else None}

@app.get("/patent/{publication_number}")
def patent(publication_number: str):
    load_records()
    r = by_publication.get(publication_number)
    if r is None:
        raise HTTPException(status_code=404, detail="Patent not found")
    return {
        "publication_number": str(r["Publication Number"]),
        "title": clean_text(r.get("Title (Translated)(English)", "")),
        "abstract": clean_text(r.get("Abstract (Translated)(English)", "")),
        "claims": clean_text(r.get("Claims (Translated)(English)", "")),
    }
