# Patent Semantic Search — Free Netlify + Render Deployment

This package keeps the existing semantic-search core: **sentence-transformers/all-MiniLM-L6-v2 + normalized embeddings + FAISS exact inner-product search**, with a default frontend/backend relevance threshold of **0.35**.

## Architecture

- `frontend/` → React + Vite → deploy to Netlify.
- `backend/` → FastAPI + FastEmbed/ONNX + FAISS + compressed patent metadata → deploy to Render Free.

The frontend is intentionally small. It does **not** contain the 10K dataset, FAISS index, Python, PyTorch, or ML model.

## 1. Deploy backend on Render (free)

1. Put this project in a GitHub repository.
2. In Render, choose **New → Web Service** and connect the repository.
3. Set **Root Directory** to `backend`.
4. Build command: `pip install --no-cache-dir -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Select the **Free** plan.
7. After deployment, open `/health`. It should report 10,000 records and 10,000 indexed vectors.

The first model initialization can take time because the lightweight ONNX MiniLM model is downloaded by FastEmbed.

## 2. Connect the Netlify frontend

Open `frontend/netlify.toml` and replace:

`https://BACKEND_URL_HERE/:splat`

with your Render service URL, for example:

`https://patent-semantic-search-api.onrender.com/:splat`

Then deploy the **frontend folder** to Netlify.

Netlify will build it with `npm run build` and publish `dist`.

## 3. Netlify upload

If using Netlify Drop, upload the **frontend folder** while logged into Netlify. Netlify can detect and build Vite projects; alternatively build locally with `npm install && npm run build` and upload `frontend/dist`.

## API behavior

- `GET /health`
- `POST /search` → maximum 20 results; threshold defaults to 0.35.
- `GET /patent/{publication_number}` → full patent details.
- If no results meet the threshold, the frontend displays exactly `N/A`.

## Important free-tier note

Render Free web services can spin down after 15 minutes of inactivity, so the first request after idle may be slow. The filesystem is ephemeral, so the project includes the precomputed FAISS index and compressed metadata in the deployment itself.
