# OpenAI GPT-4o-mini 연결 가이드

## ✅ 현재 상태
- 코드는 이미 GPT-4o-mini로 설정되어 있습니다
- Edge Function 코드가 준비되어 있습니다
- **다음 단계만 진행하면 연결됩니다!**

## 🚀 빠른 배포 (5분 안에 완료)

### 1단계: OpenAI API 키 발급
1. https://platform.openai.com/api-keys 접속
2. 로그인 후 **Create new secret key** 클릭
3. 키 이름 입력 (예: "게미마켓")
4. **키 복사** (한 번만 표시됨!)

### 2단계: Supabase Dashboard 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `xdxnvndnzziugiptuvys`

### 3단계: Edge Function 생성 및 배포
1. 왼쪽 메뉴 **Edge Functions** 클릭
2. **Create Function** 버튼 클릭
3. 함수 이름: `chat-gpt` (정확히!)
4. 코드 편집기에 `supabase/functions/chat-gpt/index.ts` 파일의 **전체 코드** 복사하여 붙여넣기
5. **Deploy** 버튼 클릭

### 4단계: OpenAI API 키 설정 (중요!)
1. **Edge Functions** > **Settings** (톱니바퀴 아이콘) 클릭
2. **Secrets** 탭 클릭
3. **Add Secret** 버튼 클릭
4. **Name**: `OPENAI_API_KEY`
5. **Value**: 1단계에서 복사한 OpenAI API 키 붙여넣기
6. **Save** 클릭

### 5단계: 확인
브라우저에서 챗봇을 열고 메시지를 보내보세요!
- 성공하면: GPT-4o-mini가 응답합니다
- 실패하면: 브라우저 콘솔(F12)에서 오류 확인

## 📋 체크리스트

배포 전 확인:
- [ ] OpenAI API 키를 발급받았나요?
- [ ] Supabase Dashboard에 로그인했나요?
- [ ] Edge Function 이름이 정확히 `chat-gpt`인가요?
- [ ] 코드를 전체 복사했나요?
- [ ] `OPENAI_API_KEY` 환경 변수를 설정했나요?

## 🔍 문제 해결

### "CORS 오류" 또는 "Failed to fetch"
→ Edge Function이 배포되지 않았습니다. 3단계를 다시 확인하세요.

### "OPENAI_API_KEY가 설정되지 않았습니다"
→ 4단계를 다시 확인하세요. 키 이름이 정확히 `OPENAI_API_KEY`여야 합니다.

### "OpenAI API 호출에 실패했습니다"
→ OpenAI API 키가 유효한지 확인하세요. 키가 만료되었거나 잘못되었을 수 있습니다.

## 💡 팁

- Edge Function 배포 후 몇 초 기다려주세요
- 브라우저를 새로고침하면 연결이 확인됩니다
- 콘솔에 "✅ GPT Edge Function 연결 성공" 메시지가 보이면 성공입니다!

## 📞 추가 도움

문제가 계속되면:
1. Supabase Dashboard > Edge Functions > `chat-gpt` > **Logs** 탭 확인
2. 브라우저 개발자 도구(F12) > Console 탭에서 오류 확인
3. `EDGE_FUNCTION_DEPLOY_GUIDE.md` 파일 참고

