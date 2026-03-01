# Terminal error fix: "Could not open requirements file"

## What went wrong

Your terminal is in the **parent** folder:
```
C:\Users\prach\Downloads\Gen AI\Coding\Hackathon\super-networkai-main
```
There is **no** `backend` folder here. The real project (with `package.json`, `backend/`, `src/`) is inside the **nested** folder with the same name.

So when you run `pip install -r backend\requirements.txt`, Windows looks for:
`...\super-networkai-main\backend\requirements.txt`  
but the file is actually at:
`...\super-networkai-main\super-networkai-main\backend\requirements.txt`

---

## Fix: go into the project folder first

Run:

```powershell
cd super-networkai-main
```

Then:

```powershell
pip install -r backend\requirements.txt
```

So the full sequence is:

```powershell
# 1. You're here: ...\super-networkai-main
cd super-networkai-main

# 2. Now you're in the project root (where package.json and backend\ live)
# Activate the venv (if you created it in the parent folder)
..\.venv\Scripts\Activate.ps1

# 3. Install backend deps
pip install -r backend\requirements.txt
```

**If you created `.venv` in the parent folder**, use `..\.venv\Scripts\Activate.ps1` after `cd super-networkai-main` so the venv still works.

**Alternatively**, create the venv **inside** the project folder so everything is in one place:

```powershell
cd super-networkai-main
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

Then for Git (from the same folder):

```powershell
git add .
git commit -m "Add backend, onboarding persistence, search API, RAG and match flow"
git push origin main
```

---

## Summary

| Where you are              | What to do                                      |
|----------------------------|-------------------------------------------------|
| `...\super-networkai-main` (parent) | `cd super-networkai-main` then run pip / git   |
| `...\super-networkai-main\super-networkai-main` (project root) | Run `pip install -r backend\requirements.txt` and git here |

"Project root" = the folder that contains **both** `package.json` and the `backend` folder.
