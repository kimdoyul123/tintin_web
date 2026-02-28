# 🎉 OpenAI 연결 완료 가이드

## ✅ 현재 상태
- ✅ Supabase 프로젝트 정보 확인 완료
- ✅ 코드 업데이트 완료
- ✅ OpenAI API 키 확인 완료 (.env 파일에 있음)

## 🚀 다음 단계: Edge Function 배포

### 1단계: Supabase Dashboard 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `xdxnvndnzziugiptuvys`

### 2단계: Edge Function 생성/업데이트
1. 왼쪽 메뉴 **Edge Functions** 클릭
2. `chat-gpt` 함수가 있는지 확인
   - **없으면**: **Create Function** → 이름: `chat-gpt` → 코드 붙여넣기 → **Deploy**
   - **있으면**: 함수 클릭 → 코드 확인/업데이트 → **Deploy**

**코드 위치**: `supabase/functions/chat-gpt/index.ts` 파일의 전체 코드 복사

### 3단계: OpenAI API 키 설정 (중요!)
1. **Edge Functions** > **Settings** (톱니바퀴 아이콘) 클릭
2. **Secrets** 탭 클릭
3. **Add Secret** 버튼 클릭 (또는 기존 키 수정)
4. **Name**: `OPENAI_API_KEY` (정확히!)
5. **Value**: 아래 키를 복사하여 붙여넣기
   ```
   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
   ```
6. **Save** 클릭

### 4단계: Supabase 환경 변수 설정 (선택사항)
Edge Function에서 Supabase 데이터베이스에 접근하려면:

1. **Edge Functions** > **Settings** > **Secrets**
2. **Add Secret** 클릭
3. **Name**: `SUPABASE_URL`
4. **Value**: `https://xdxnvndnzziugiptuvys.supabase.co`
5. **Save** 클릭

6. **Add Secret** 클릭
7. **Name**: `SUPABASE_SERVICE_ROLE_KEY`
8. **Value**: Supabase Dashboard > Settings > API > **service_role key** 복사
9. **Save** 클릭

## ✅ 완료 확인

브라우저에서 챗봇을 열고 메시지를 보내보세요:
- **성공**: GPT-4o-mini가 응답합니다! 🎉
- **실패**: 브라우저 콘솔(F12)에서 오류 확인

## 🔍 문제 해결

### "OPENAI_API_KEY가 설정되지 않았습니다"
→ 3단계를 다시 확인하세요. 키 이름이 정확히 `OPENAI_API_KEY`여야 합니다.

### "CORS 오류" 또는 "Failed to fetch"
→ Edge Function이 배포되지 않았습니다. 2단계를 다시 확인하세요.

### "Supabase 클라이언트가 초기화되지 않았습니다"
→ 4단계의 Supabase 환경 변수를 설정하세요.

## 💡 팁

- Edge Function 배포 후 몇 초 기다려주세요
- 브라우저를 새로고침하면 연결이 확인됩니다
- 콘솔에 "✅ GPT Edge Function 연결 성공" 메시지가 보이면 성공!

## 📞 추가 도움

문제가 계속되면:
1. Supabase Dashboard > Edge Functions > `chat-gpt` > **Logs** 탭 확인
2. 브라우저 개발자 도구(F12) > Console 탭에서 오류 확인
3. `FUNCTION_CALLING_가이드.md` 파일 참고

