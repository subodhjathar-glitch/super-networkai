# Push to GitHub (then use in Lovable)

Your project is committed locally. To push to GitHub:

1. **Create a new repo on GitHub**  
   Go to https://github.com/new — create a repository (e.g. `super-networkai`). **Do not** add a README or .gitignore (you already have them).

2. **Add the remote and push** (run from this folder: `super-networkai-main`):

   ```powershell
   cd "c:\Users\prach\Downloads\Gen AI\Coding\Hackathon\super-networkai-main\super-networkai-main"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

   Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and repo name.

3. **Connect to Lovable**  
   In Lovable, import the project from GitHub. Set env vars (see `LOVABLE_SETUP.md`). The app runs with mock search if no backend is set.

**Note:** `.env` is in `.gitignore` — your keys are not pushed. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Lovable’s environment (or use Lovable’s Supabase integration).
