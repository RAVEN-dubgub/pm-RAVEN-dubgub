@echo off
setlocal
cd /d "%~dp0.."

echo.
echo Add OPENAI_API_KEY to Vercel (pm-raven-dubgub)
echo Get a key: https://platform.openai.com/api-keys
echo.
set /p OPENAI_KEY=Paste your OpenAI API key (sk-...): 

if "%OPENAI_KEY%"=="" (
  echo No key entered. Exiting.
  exit /b 1
)

echo Adding to production, preview, and development...
call npx.cmd vercel env add OPENAI_API_KEY production,preview,development --value "%OPENAI_KEY%" --yes --sensitive
if errorlevel 1 (
  echo Failed to add env var.
  exit /b 1
)

echo.
echo Redeploying production so the key takes effect...
call npx.cmd vercel --prod --yes
if errorlevel 1 (
  echo Env var added but redeploy failed. Run: npx.cmd vercel --prod --yes
  exit /b 1
)

echo.
echo Done. Test: Tasks - focus a task - Get Cursor plan
endlocal
