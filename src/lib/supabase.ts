import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 환경 변수 디버깅 (개발 환경에서만)
if (import.meta.env.DEV) {
  console.log('Supabase 환경 변수 확인:', {
    url: supabaseUrl ? '설정됨' : '미설정',
    key: supabaseAnonKey ? '설정됨' : '미설정',
    urlLength: supabaseUrl.length,
    keyLength: supabaseAnonKey.length,
  });
}

// 환경 변수가 없을 때 경고 메시지
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error(`
  ⚠️ Supabase 환경 변수가 설정되지 않았습니다!
  
  Vercel 배포 환경에서는:
  1. Vercel Dashboard > Project Settings > Environment Variables
  2. 다음 환경 변수를 추가하세요:
  
     VITE_SUPABASE_URL = https://xdxnvndnzziugiptuvys.supabase.co
     VITE_SUPABASE_ANON_KEY = sb_publishable_Fozq77Nh3-FdgrjVSme5Uw_ODT5IOQk
  
  3. Production, Preview, Development 모두에 체크
  4. 재배포하세요
  
  로컬 개발 환경에서는:
  - .env 파일에 환경 변수를 추가하세요
  `);
}

// 유효하지 않은 URL일 경우 빈 클라이언트 생성 방지
const validUrl = supabaseUrl && !supabaseUrl.includes('placeholder') 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co';
const validKey = supabaseAnonKey && supabaseAnonKey !== 'placeholder-anon-key' 
  ? supabaseAnonKey 
  : 'placeholder-anon-key';

// Supabase 클라이언트 생성 (옵션 추가)
export const supabase = createClient(validUrl, validKey, {
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

