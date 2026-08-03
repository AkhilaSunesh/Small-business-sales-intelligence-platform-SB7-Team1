@echo off
REM ============================================================
REM MarketMind AI — Start All System Services (Frontend, Gateway, Backend, AI)
REM ============================================================

echo.
echo ============================================================
echo   MarketMind AI -- Starting All Services
echo ============================================================
echo.

set ROOT_DIR=%~dp0
set VENV_PATH=%ROOT_DIR%Devops_Integration\venv\Scripts\activate

echo 1. Starting Backend Database Service...
start "Backend Database Service" cmd /k "cd /d %ROOT_DIR%Backend_Databse && npm run dev"
timeout /t 1 /nobreak >nul

echo 2. Starting Security API Gateway...
start "Security API Gateway" cmd /k "cd /d %ROOT_DIR%Security_API_gateway && npm run dev"
timeout /t 1 /nobreak >nul

echo 3. Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %ROOT_DIR%Frontend && npm run dev"
timeout /t 1 /nobreak >nul

echo 4. Starting Devops AI Service (Port 5001)...
start "Devops AI Service" cmd /k "cd /d %ROOT_DIR%Devops_Integration && call venv\Scripts\activate && uvicorn ai_service:app --host 0.0.0.0 --port 5001"
timeout /t 1 /nobreak >nul

echo 5. Starting Customer Segmentation (Port 5010)...
start "Customer Segmentation" cmd /k "cd /d %ROOT_DIR%AIML\api\segmentation && call %VENV_PATH% && python app.py"
timeout /t 1 /nobreak >nul

echo 6. Starting Churn Prediction (Port 5011)...
start "Churn Prediction" cmd /k "cd /d %ROOT_DIR%AIML\api\churn && call %VENV_PATH% && python app.py"
timeout /t 1 /nobreak >nul

echo 7. Starting Product Recommendations (Port 5012)...
start "Product Recommendations" cmd /k "cd /d %ROOT_DIR%AIML\api\recommendation && call %VENV_PATH% && python app.py"
timeout /t 1 /nobreak >nul

echo 8. Starting Anomaly Detection (Port 5013)...
start "Anomaly Detection" cmd /k "cd /d %ROOT_DIR%AIML\api\anomaly && call %VENV_PATH% && python app.py"
timeout /t 1 /nobreak >nul

echo 9. Starting Sales Forecast (Port 5014)...
start "Sales Forecast" cmd /k "cd /d %ROOT_DIR%AIML\api\forecast && call %VENV_PATH% && python app.py"

echo.
echo ============================================================
echo   All 9 services have been started in separate windows!
echo ============================================================
echo.
pause
