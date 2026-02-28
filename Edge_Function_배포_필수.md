# ⚠️ Edge Function 배포가 필요합니다

## 현재 상황
챗봇이 계속 로컬 폴백 응답만 하고 있습니다. 이는 **Edge Function이 배포되지 않았거나 연결되지 않았기 때문**입니다.

## 🚀 해결 방법

### 방법 1: 배포 스크립트 실행 (가장 쉬움)

1. `배포_스크립트.bat` 파일을 **더블클릭**하여 실행
2. 브라우저가 열리면 Supabase 계정으로 로그인
3. 자동으로 배포가 진행됩니다!

### 방법 2: 수동 배포 (터미널 사용)

터미널을 열고 다음 명령어를 **순서대로** 실행:

```bash
# 1. Supabase 로그인 (브라우저가 열립니다)
npx supabase login

# 2. 프로젝트 연결
npx supabase link --project-ref xdxnvndnzziugiptuvys

# 3. Edge Function 배포
npx supabase functions deploy chat-gpt

# 4. OpenAI API 키 설정
npx supabase secrets set OPENAI_API_KEY=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
```

### 방법 3: Supabase Dashboard에서 직접 배포

1. https://supabase.com/dashboard 접속
2. 프로젝트 `xdxnvndnzziugiptuvys` 선택
3. 왼쪽 메뉴에서 **Edge Functions** 찾기
   - 메뉴가 보이지 않으면: **SQL Editor** 또는 **Database** 메뉴 옆에 있을 수 있습니다
   - 또는 프로젝트 설정에서 Edge Functions 기능이 활성화되어 있는지 확인
4. **Create Function** 또는 **New Function** 버튼 클릭
5. 함수 이름: `chat-gpt`
6. `supabase/functions/chat-gpt/index.ts` 파일의 **전체 코드** 복사하여 붙여넣기
7. **Deploy** 또는 **Save** 클릭
8. **Settings** > **Secrets**에서 `OPENAI_API_KEY` 환경 변수 설정

## ✅ 배포 확인

배포가 완료되면:
1. 브라우저를 **새로고침**
2. 챗봇에 메시지 보내기
3. GPT-4o-mini가 응답하면 성공! 🎉

## 🔍 문제 해결

### 여전히 로컬 폴백 응답만 나옴
- 브라우저 콘솔(F12)에서 오류 확인
- Supabase Dashboard > Edge Functions > `chat-gpt` > **Logs** 탭 확인
- Edge Function이 정말 배포되었는지 확인

### "CORS 오류" 또는 "Failed to fetch"
- Edge Function이 배포되지 않았습니다
- 배포를 다시 시도하세요

### "OPENAI_API_KEY가 설정되지 않았습니다"
- Supabase Dashboard > Edge Functions > Settings > Secrets에서 키 확인
- 키 이름이 정확히 `OPENAI_API_KEY`인지 확인

## 💡 중요 사항

- Edge Function 배포는 **필수**입니다
- 배포 없이는 GPT-4o-mini가 작동하지 않습니다
- 배포 후 몇 초 기다려주세요

