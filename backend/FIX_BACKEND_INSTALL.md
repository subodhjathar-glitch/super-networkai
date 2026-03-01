# Fix backend install (Python 3.14 not supported)

Your system has **Python 3.14**. The backend needs **Python 3.11 or 3.12** — pydantic-core has no wheels for 3.14 and building from source needs Rust and is not officially supported.

---

## Option 1: Install Python 3.12 with winget (quickest)

In **PowerShell** (Run as Administrator if winget asks):

```powershell
winget install Python.Python.3.12 --accept-package-agreements --accept-source-agreements
```

Then **close and reopen** your terminal (or Cursor). After that:

```powershell
cd "C:\Users\prach\Downloads\Gen AI\Coding\Hackathon\super-networkai-main\super-networkai-main"
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

---

## Option 2: Install Python 3.12 from the website

1. Open: **https://www.python.org/downloads/release/python-3129/**
2. Download **Windows installer (64-bit)**.
3. Run it and check **"Add python.exe to PATH"**.
4. **Close and reopen** the terminal, then run the same four commands as in Option 1 (cd, venv, activate, pip install).

---

## Option 3: Let py launcher install Python 3.12 (if your system supports it)

In PowerShell:

```powershell
$env:PYLAUNCHER_ALLOW_INSTALL=1
py -3.12 -m venv .venv
```

If that installs 3.12, then:

```powershell
cd "C:\Users\prach\Downloads\Gen AI\Coding\Hackathon\super-networkai-main\super-networkai-main"
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

---

## After install works

Run the backend:

```powershell
cd backend
uvicorn main:app --reload --port 8000
```

---

## Why not stay on Python 3.14?

- **pydantic-core** (used by FastAPI) has **no pre-built wheel** for Python 3.14 on Windows.
- Building from source needs **Rust**, and even with Rust, the build stack does not yet support 3.14.
- So you **must** use **Python 3.11 or 3.12** for this backend. Installing 3.12 does not remove 3.14; you can keep both.
