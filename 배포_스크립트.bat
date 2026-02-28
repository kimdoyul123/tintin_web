@echo off
echo ========================================
echo Supabase Edge Function 배포 스크립트
echo ========================================
echo.

echo [1/4] Supabase 로그인 중...
npx supabase login
if %errorlevel% neq 0 (
    echo 로그인 실패! 수동으로 진행하세요.
    pause
    exit /b 1
)

echo.
echo [2/4] 프로젝트 연결 중...
npx supabase link --project-ref xdxnvndnzziugiptuvys
if %errorlevel% neq 0 (
    echo 프로젝트 연결 실패! 프로젝트 ID를 확인하세요.
    pause
    exit /b 1
)

echo.
echo [3/4] Edge Function 배포 중...
npx supabase functions deploy chat-gpt
if %errorlevel% neq 0 (
    echo 배포 실패! 코드를 확인하세요.
    pause
    exit /b 1
)

echo.
echo [4/4] OpenAI API 키 설정 중...
npx supabase secrets set OPENAI_API_KEY=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
if %errorlevel% neq 0 (
    echo API 키 설정 실패!
    pause
    exit /b 1
)

echo.
echo ========================================
echo 배포 완료!
echo ========================================
echo.
echo 이제 브라우저에서 챗봇을 테스트해보세요.
pause

