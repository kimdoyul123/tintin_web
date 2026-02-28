import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 설정 값 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 환경 변수가 설정되지 않았으면 경고
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 .env 파일에 설정해주세요.');
}

// 환경 변수 디버깅 (개발 환경에서만)
if (import.meta.env.DEV) {
  console.log('Supabase 환경 변수 확인:', {
    url: supabaseUrl ? '설정됨' : '미설정',
    key: supabaseAnonKey ? '설정됨' : '미설정',
  });
}

// Supabase 클라이언트 생성 (옵션 추가)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-client-info': 'tintin-web@1.0.0',
    },
  },
});

// 연결 테스트 함수 (개발용)
if (import.meta.env.DEV) {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Supabase 연결 오류:', error);
    } else {
      console.log('Supabase 연결 성공');
    }
  });
}

