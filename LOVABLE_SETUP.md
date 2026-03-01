# SuperNetworkAI – Lovable setup

1. **Import this repo** in [Lovable](https://lovable.dev) (connect your GitHub and select this repository).

2. **Environment variables** (in Lovable project settings):
   - `VITE_SUPABASE_URL` – your Supabase project URL (Lovable may inject this if you use Lovable’s Supabase).
   - `VITE_SUPABASE_PUBLISHABLE_KEY` – Supabase anon key.
   - `VITE_API_URL` – leave empty for now; the app works with mock search. When you have a backend, set it to that API URL.

3. **Run** – Lovable will build and deploy the frontend. Onboarding and Search (with demo matches) work without a backend.

4. **Optional backend** – The `backend/` folder is a FastAPI app for AI search and embeddings. You can run it separately (e.g. Railway, Render) and set `VITE_API_URL` to enable real search.
