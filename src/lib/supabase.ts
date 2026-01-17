import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 환경 변수가 없을 때 경고 메시지
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error(`
  ⚠️ Supabase 환경 변수가 설정되지 않았습니다!
  
  다음 단계를 따라주세요:
  1. tintin_web-main 폴더에 .env 파일을 생성하세요
  2. 다음과 같이 환경 변수를 추가하세요:
  
     VITE_SUPABASE_URL=your-supabase-project-url
     VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
  
  3. 서버를 재시작하세요
  
  Supabase 프로젝트가 없다면:
  - https://supabase.com 에서 무료 프로젝트를 생성하세요
  - 프로젝트 설정 > API에서 URL과 anon key를 확인하세요
  `);
}

// 유효하지 않은 URL일 경우 빈 클라이언트 생성 방지
const validUrl = supabaseUrl && !supabaseUrl.includes('placeholder') 
  ? supabaseUrl 
  : 'https://placeholder.supabase.co';
const validKey = supabaseAnonKey && supabaseAnonKey !== 'placeholder-anon-key' 
  ? supabaseAnonKey 
  : 'placeholder-anon-key';

export const supabase = createClient(validUrl, validKey);

