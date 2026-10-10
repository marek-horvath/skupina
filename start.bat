@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

where docker >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker was not found.
  echo Install and start Docker Desktop, then run start.bat again.
  goto :fail
)

docker info >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker Engine is not running.
  echo Start Docker Desktop and wait until it is ready, then run start.bat again.
  goto :fail
)

docker compose version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker Compose is not available.
  echo Update Docker Desktop to a version that includes Docker Compose v2.
  goto :fail
)

if not exist ".env" (
  for /f %%P in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString('N')"') do set "GENERATED_PASSWORD=%%P"
  > ".env" echo ADMIN_PASSWORD=!GENERATED_PASSWORD!
  >> ".env" echo FRONTEND_PORT=8090
  >> ".env" echo API_PORT=5174
  >> ".env" <nul set /p "=OPENALEX_API_KEY="
  echo Created .env with a random local admin password:
  echo !GENERATED_PASSWORD!
  echo.
)

echo Building and starting SEUG...
docker compose up -d --build
if errorlevel 1 (
  echo ERROR: Docker Compose could not start the application.
  docker compose logs --tail=60
  goto :fail
)

echo Waiting for the application to become ready...
for /f "tokens=2 delims=:" %%P in ('docker compose port frontend 8080') do set "FRONTEND_PORT=%%P"
if not defined FRONTEND_PORT (
  echo ERROR: Could not determine the frontend port.
  docker compose ps
  goto :fail
)
set "APP_URL=http://localhost:!FRONTEND_PORT!/"
set /a ATTEMPT=0

:wait_for_app
set /a ATTEMPT+=1
powershell -NoProfile -Command "try { $response = Invoke-WebRequest -UseBasicParsing -Uri '!APP_URL!' -TimeoutSec 3; if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) { exit 0 } } catch {}; exit 1"
if not errorlevel 1 goto :ready

if %ATTEMPT% GEQ 60 (
  echo ERROR: The application did not become ready within two minutes.
  docker compose ps
  docker compose logs --tail=60
  goto :fail
)

powershell -NoProfile -Command "Start-Sleep -Seconds 2"
goto :wait_for_app

:ready
echo SEUG is ready at !APP_URL!
start "" "!APP_URL!"
exit /b 0

:fail
echo.
echo The application was not started. Review the message above.
pause
exit /b 1
