# OpenAI Function Calling 가이드

## ✅ 구현 완료

OpenAI Function Calling 기능이 추가되었습니다! AI가 필요할 때 자동으로 함수를 호출할 수 있습니다.

## 🎯 사용 가능한 함수들

### 1. `search_products`
- **용도**: 상품 검색
- **파라미터**: `query` (검색어)
- **예시**: "RPG 게임 찾아줘", "시뮬레이션 게임 검색"

### 2. `get_product_details`
- **용도**: 특정 상품의 상세 정보 조회
- **파라미터**: `product_id` (상품 ID)
- **예시**: "1번 상품 정보 알려줘"

### 3. `get_customer_info`
- **용도**: 고객 정보 조회
- **파라미터**: `email` (이메일 주소)
- **예시**: "이메일로 고객 정보 확인"

## 🔧 동작 방식

1. 사용자가 메시지를 보냅니다 (예: "RPG 게임 찾아줘")
2. AI가 `search_products` 함수 호출이 필요하다고 판단
3. Edge Function이 함수를 실행하고 결과를 반환
4. AI가 함수 결과를 바탕으로 사용자에게 응답

## 📋 Edge Function 환경 변수 설정

Function Calling이 작동하려면 다음 환경 변수가 필요합니다:

### 필수:
- `OPENAI_API_KEY`: OpenAI API 키

### 선택 (Supabase 함수 호출용):
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키

**참고**: Supabase Edge Function은 자동으로 Supabase 클라이언트를 제공하므로, 환경 변수가 없어도 요청 헤더를 통해 정보를 가져올 수 있습니다.

## 🚀 배포 방법

1. `supabase/functions/chat-gpt/index.ts` 파일의 전체 코드를 복사
2. Supabase Dashboard > Edge Functions > `chat-gpt` 함수 편집
3. 코드 붙여넣기 후 **Deploy**
4. 환경 변수 설정:
   - `OPENAI_API_KEY` (필수)
   - `SUPABASE_URL` (선택, 자동 감지 가능)
   - `SUPABASE_SERVICE_ROLE_KEY` (선택, 자동 감지 가능)

## 💡 사용 예시

### 예시 1: 상품 검색
**사용자**: "RPG 게임 찾아줘"
**AI 동작**:
1. `search_products("RPG")` 함수 호출
2. 검색 결과 받기
3. 사용자에게 결과 전달

### 예시 2: 상품 상세 정보
**사용자**: "1번 게임 자세히 알려줘"
**AI 동작**:
1. `get_product_details(1)` 함수 호출
2. 상품 정보 받기
3. 사용자에게 상세 정보 전달

### 예시 3: 고객 정보 확인
**사용자**: "내 정보 확인해줘" (로그인 상태)
**AI 동작**:
1. `get_customer_info(userEmail)` 함수 호출
2. 고객 정보 받기
3. 사용자에게 정보 전달

## 🔍 문제 해결

### 함수가 호출되지 않는 경우
- OpenAI API 키가 올바른지 확인
- Edge Function이 최신 버전으로 배포되었는지 확인
- 브라우저 콘솔에서 오류 확인

### "Supabase 클라이언트가 초기화되지 않았습니다" 오류
- Supabase 환경 변수가 설정되었는지 확인
- 또는 Edge Function이 자동으로 Supabase 정보를 가져오는지 확인

## 📝 참고사항

- AI는 필요할 때만 함수를 호출합니다
- 최대 5번의 함수 호출 루프를 지원합니다 (재귀적 호출)
- 함수 실행 결과는 자동으로 AI에게 전달되어 자연스러운 응답을 생성합니다

