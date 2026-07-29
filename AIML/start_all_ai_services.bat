@echo off
REM ============================================================
REM MarketMind AI — Start All AI Microservices
REM ============================================================
REM Port mapping:
REM   segmentation   5010  Customer Segmentation
REM   churn          5011  Churn Prediction
REM   recommendation 5012  Product Recommendations
REM   anomaly        5013  Anomaly Detection
REM   forecast       5014  Sales Forecast (FastAPI)
REM
REM Usage: Double-click or run from Command Prompt
REM ============================================================

echo.
echo ============================================================
echo   MarketMind AI -- Starting All AI Services
echo ============================================================
echo.

REM Get the directory where this .bat file lives (AIML folder)
set AIML_DIR=%~dp0
set API_DIR=%AIML_DIR%api

echo Starting Customer Segmentation on port 5010...
start "Customer Segmentation :5010" cmd /k "cd /d %API_DIR%\segmentation && python app.py"

timeout /t 1 /nobreak >nul

echo Starting Churn Prediction on port 5011...
start "Churn Prediction :5011" cmd /k "cd /d %API_DIR%\churn && python app.py"

timeout /t 1 /nobreak >nul

echo Starting Product Recommendations on port 5012...
start "Recommendations :5012" cmd /k "cd /d %API_DIR%\recommendation && python app.py"

timeout /t 1 /nobreak >nul

echo Starting Anomaly Detection on port 5013...
start "Anomaly Detection :5013" cmd /k "cd /d %API_DIR%\anomaly && python app.py"

timeout /t 1 /nobreak >nul

echo Starting Sales Forecast (FastAPI) on port 5014...
start "Sales Forecast :5014" cmd /k "cd /d %API_DIR%\forecast && uvicorn app:app --host 0.0.0.0 --port 5014 --reload"

echo.
echo ============================================================
echo   All AI services starting in separate windows.
echo.
echo   Direct endpoints:
echo     http://localhost:5010/customer-groups
echo     http://localhost:5011/churn
echo     http://localhost:5012/recommendations
echo     http://localhost:5013/anomaly-detection
echo     http://localhost:5014/forecast
echo.
echo   Via Gateway (port 7000):
echo     http://localhost:7000/api/customer-groups
echo     http://localhost:7000/api/churn
echo     http://localhost:7000/api/recommendations
echo     http://localhost:7000/api/anomaly-detection
echo     http://localhost:7000/api/forecast
echo ============================================================
echo.
pause
