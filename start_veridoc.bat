@echo off
title VeriDoc 2.0 - AI Fake Identity & Document Screening Platform
echo =========================================================================
echo  VeriDoc 2.0 - AI Fake Identity & Document Screening Platform
echo  Smart India Hackathon 2026 - Ministry of Home Affairs
echo =========================================================================
echo.

cd /d "%~dp0"

echo [1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000 ...
start "VeriDoc 2.0 Backend" cmd /k "backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "VeriDoc 2.0 Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services launched!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo.
pause
