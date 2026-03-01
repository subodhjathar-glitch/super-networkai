# Backend install error: pydantic-core / Rust

## What went wrong

`pip install -r backend\requirements.txt` failed while building **pydantic-core**:

- Your Python is **3.14** (very new).
- **pydantic-core** has no pre-built wheel for Python 3.14 on Windows, so pip tries to **build from source**, which needs **Rust** (and Cargo). The build then failed because Rust/Cargo is not installed or not on PATH.

So the error is: **Python 3.14 + pydantic-core** (needs Rust to compile on 3.14).

---

## Fix: use Python 3.11 or 3.12 for the backend

Use a slightly older Python that has pre-built wheels for pydantic-core.

### 1. Install Python 3.12 (if you don’t have it)

- Download: https://www.python.org/downloads/release/python-3120/
- Or from Microsoft Store: search “Python 3.12”.
- During setup, check **“Add Python to PATH”**.

### 2. Create a new venv with Python 3.12

From the **project root** (the folder that has `package.json` and `backend\`):

```powershell
# Remove the old venv (optional; it was created with 3.14)
# If the venv is in the parent folder: Remove-Item -Recurse -Force ..\.venv

# Create venv with Python 3.12 (use py -3.12 or python3.12 depending on your system)
py -3.12 -m venv .venv

# Activate (from project root)
.venv\Scripts\Activate.ps1

# Install backend deps (should use pre-built wheels now)
pip install -r backend\requirements.txt
```

If `py -3.12` is not found, try:

- `python3.12 -m venv .venv`
- Or the full path to Python 3.12, e.g. `C:\Users\prach\AppData\Local\Programs\Python\Python312\python.exe -m venv .venv`

### 3. Run the backend

```powershell
cd backend
uvicorn main:app --reload --port 8000
```

---

## If you must keep Python 3.14

You would need to:

- Install **Rust**: https://rustup.rs/ (run the installer, restart the terminal), then run `pip install -r backend\requirements.txt` again; or  
- Wait until pydantic-core publishes a wheel for Python 3.14.

Easiest path is to use **Python 3.12** for this project’s venv.
