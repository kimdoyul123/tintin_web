# Edge Function 배포 가이드 (빠른 해결)

## CORS 오류 해결 방법

현재 CORS 오류가 발생하고 있습니다. Edge Function을 Supabase에 배포해야 합니다.

## 방법 1: Supabase Dashboard에서 직접 배포 (가장 빠름)

### 1단계: Supabase Dashboard 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: `xdxnvndnzziugiptuvys`

### 2단계: Edge Function 생성
1. 왼쪽 메뉴에서 **Edge Functions** 클릭
2. **Create Function** 버튼 클릭
3. 함수 이름: `chat-gpt` (정확히 일치해야 함)
4. **Deploy** 클릭

### 3단계: 코드 붙여넣기
1. `supabase/functions/chat-gpt/index.ts` 파일 열기
2. 전체 코드 복사
3. Supabase Dashboard의 코드 편집기에 붙여넣기
4. **Deploy** 버튼 클릭

### 4단계: 환경 변수 설정 (중요!)
1. **Edge Functions** > **Settings** > **Secrets** 클릭
2. **Add Secret** 클릭
3. 이름: `OPENAI_API_KEY`
4. 값: OpenAI API 키 입력 (https://platform.openai.com/api-keys 에서 발급)
5. **Save** 클릭

### 5단계: 테스트
브라우저 콘솔에서:
```javascript
// Edge Function이 정상 작동하는지 확인
const { data, error } = await supabase.functions.invoke('chat-gpt', {
  body: { messages: [{ role: 'user', content: '안녕' }] }
});
console.log('결과:', data);
console.log('오류:', error);
```

## 방법 2: Supabase CLI 사용

### 1단계: CLI 설치 및 로그인
```bash
npm install -g supabase
supabase login
```

### 2단계: 프로젝트 연결
```bash
supabase link --project-ref xdxnvndnzziugiptuvys
```

### 3단계: Edge Function 배포
```bash
supabase functions deploy chat-gpt
```

### 4단계: 환경 변수 설정
```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

## OpenAI API 키 발급 방법

1. https://platform.openai.com/api-keys 접속
2. 로그인
3. **Create new secret key** 클릭
4. 키 이름 입력 (예: "게미마켓 챗봇")
5. 키 복사 (한 번만 표시되므로 안전하게 보관)
6. Supabase Secrets에 추가

## 배포 후 확인

배포가 완료되면:
- 브라우저 콘솔의 CORS 오류가 사라집니다
- 챗봇이 GPT 모델과 정상적으로 통신합니다
- 콘솔에 "✅ GPT Edge Function 연결 성공" 메시지가 표시됩니다

## 문제 해결

### 여전히 CORS 오류가 발생하는 경우
1. Edge Function이 정말 배포되었는지 확인
2. 함수 이름이 정확히 `chat-gpt`인지 확인
3. 브라우저 캐시 삭제 후 재시도
4. Supabase Dashboard > Edge Functions > Logs에서 오류 확인

### "OPENAI_API_KEY가 설정되지 않았습니다" 오류
- Supabase Dashboard > Edge Functions > Settings > Secrets에서 키 확인
- 키 이름이 정확히 `OPENAI_API_KEY`인지 확인
- 키 값이 올바른지 확인

### Edge Function이 응답하지 않는 경우
- Supabase Dashboard > Edge Functions > Logs 확인
- 함수 코드에 문법 오류가 없는지 확인
- OpenAI API 키가 유효한지 확인

