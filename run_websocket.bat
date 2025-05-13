@echo off
echo Starting WebSocket Server...

:: Check if we're in the correct directory
if not exist "backend\manage.py" (
    echo Error: manage.py not found. Please make sure you're in the project root directory.
    pause
    exit /b 1
)

:: Check if virtual environment exists
if not exist "venv\Scripts\activate.bat" (
    echo Error: Virtual environment not found. Please make sure venv exists.
    pause
    exit /b 1
)

:: Change to backend directory
cd backend

:: Activate virtual environment
call ..\venv\Scripts\activate.bat

:: Run the Daphne server
echo Starting Daphne WebSocket server on port 8001...
python -m daphne -p 8001 agriconnect.asgi:application

:: Keep the window open if there's an error
pause 