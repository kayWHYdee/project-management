@echo off
REM ---------------------------------------------------------------------------
REM  Double-click to (re)build and start uniquepm.
REM  Requires Docker Desktop to be running (it launches at login by default).
REM  The window shows the logs and stays open while the app runs.
REM  Press Ctrl+C, or close the window, to stop it.
REM ---------------------------------------------------------------------------
cd /d "%~dp0"
docker compose up --build
pause
