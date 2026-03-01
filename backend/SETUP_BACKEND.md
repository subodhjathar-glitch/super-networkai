# Backend still failing? Do this (Python 3.14 fix)

You're on **Python 3.14**. The backend needs **Python 3.11 or 3.12** so that `pydantic-core` installs from a pre-built wheel (no Rust needed).

---

## Step 1: Install Python 3.12

1. Open: **https://www.python.org/downloads/release/python-3129/**
2. Scroll to **Files** and download:
   - **Windows installer (64-bit)**: `python-3.12.9-amd64.exe`
3. Run the installer.
   - Check **"Add python.exe to PATH"** at the bottom.
   - Click **Install Now** (or **Customize** and then install).
4. **Close and reopen** your terminal (or Cursor) so PATH updates.

---

## Step 2: Create a new venv with Python 3.12

Open PowerShell and go to the **project root** (the folder that has `package.json` and `backend\`):

```powershell
cd "C:\Users\prach\Downloads\Gen AI\Coding\Hackathon\super-networkai-main\super-networkai-main"
```

Create a new venv using Python 3.12 (this will create a `.venv` folder **inside** this project folder):

```powershell
py -3.12 -m venv .venv
```

If `py -3.12` says "not found", try:

```powershell
python3.12 -m venv .venv
```

or use the full path to the Python 3.12 executable you installed.

---

## Step 3: Activate and install

Activate the new venv (from the **same** folder):

```powershell
.venv\Scripts\Activate.ps1
```

You should see `(.venv)` at the start of the line. Then:

```powershell
pip install -r backend\requirements.txt
```

This should finish without the pydantic-core / Rust error.

---

## Step 4: Run the backend

```powershell
cd backend
uvicorn main:app --reload --port 8000
```

---

## If you still get "No suitable Python runtime found"

- Make sure you **restarted the terminal** (or Cursor) after installing Python 3.12.
- Check that 3.12 is on PATH: run `py -0` or `py --list` to see installed versions.
- If 3.12 is there but `py -3.12` fails, try the full path, e.g.  
  `C:\Users\prach\AppData\Local\Programs\Python\Python312\python.exe -m venv .venv`

---

## Why `.venv\Scripts\Activate.ps1` failed

You ran it from the **project folder** (`...\super-networkai-main\super-networkai-main`), but the **.venv** that existed was in the **parent** folder. So:

- From the **project folder**, use **`..\.venv\Scripts\Activate.ps1`** to activate the parent’s venv (that one uses Python 3.14).
- To avoid the pydantic error, create a **new** venv **in the project folder** with Python 3.12 (Step 2 above), then use **`.venv\Scripts\Activate.ps1`** from that same folder.
