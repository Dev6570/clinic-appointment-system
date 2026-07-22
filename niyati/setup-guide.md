1. Clone the generated student repository.
2. Install frontend dependencies with `npm install --prefix frontend`.
3. Install backend dependencies with `pip install -r backend/requirements.txt`.
4. Start the backend with `uvicorn app.main:app --app-dir backend --reload --port 8000`.
5. Build the frontend with `npm run build --prefix frontend` and deploy both services through Render using the generated `render.yaml`.
6. Keep `/health`, `/api/version`, and `/api/ping` operational while implementing the ticket workflow.
