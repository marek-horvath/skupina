@echo off
setlocal
cd /d "%~dp0"

where docker >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker was not found.
  echo Install Docker Desktop or stop the containers from Docker Desktop.
  goto :fail
)

docker info >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker Engine is not running.
  echo Start Docker Desktop or stop the containers from Docker Desktop.
  goto :fail
)

docker compose down
if errorlevel 1 (
  echo ERROR: Docker Compose could not stop the application.
  goto :fail
)

echo SEUG was stopped. Persistent data was kept.
exit /b 0

:fail
echo.
pause
exit /b 1
