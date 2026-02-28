-- ============================================
-- 게미마켓 데이터베이스 스키마 (예외처리 포함)
-- 테이블 3개: 상품(products), 고객(customers), 주문(orders)
-- 이미 존재하는 객체는 건너뛰고, 에러 없이 실행됩니다.
-- Supabase SQL Editor에 복사하여 실행하세요
-- ============================================

BEGIN;

-- ============================================
-- 1. 상품 테이블 (products)
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slogan TEXT,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 (IF NOT EXISTS로 중복 방지)
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- RLS 설정 (ENABLE은 이미 활성화되어 있어도 에러 없음)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 정책: 먼저 삭제 후 재생성 (이미 있어도 안전)
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products"
  ON products
  FOR SELECT
  USING (true);

-- 상품 초기 데이터 (이미 있는 ID는 건너뜀)
INSERT INTO products (id, name, slogan, description, price, image_url, category) VALUES
(1, '더 미라지 크로니클: 얼티밋 에디션',
    '당신이 기다려온 ''차세대'' 대서사시. 현실을 잊게 할 압도적인 몰입감을 경험하세요.',
    '광활한 판타지 세계에서 펼쳐지는 장대한 스토리. 수백 시간의 콘텐츠와 숨막히는 비주얼이 당신을 기다립니다.',
    79000, 'game-mirage.png', 'RPG'),
(2, '포근한 농장의 하루: 힐링 시뮬레이터',
    '복잡한 일상에서 잠시 로그아웃! 흙 내음 가득한 나만의 작은 행복을 가꿔보세요.',
    '귀여운 동물들과 함께하는 평화로운 농장 생활. 스트레스 없이 마음을 편안하게 해주는 힐링 게임입니다.',
    24000, 'game-farm.png', 'Simulation'),
(3, '다크니스 던전 3 (리마스터)',
    '전설이 돌아왔다. 그때의 심장은 그대로, 그래픽은 더 선명하게! 명작의 무게를 다시 느껴보세요.',
    '클래식 던전 크롤러의 귀환. 현대적인 그래픽과 개선된 전투 시스템으로 재탄생했습니다.',
    35000, 'game-dungeon.png', 'Classic'),
(4, '갤럭시 워로드: 팀 배틀 패키지',
    '솔로는 없다! 친구와 함께 우주를 정복하라. 치열한 전략과 팀워크로 승리의 쾌감을 맛보세요.',
    '대규모 우주 전투를 경험하세요. 함대를 지휘하고 동맹을 맺어 은하계의 패권을 차지하세요.',
    45000, 'game-galaxy.png', 'Strategy'),
(5, '템플 오브 이그드라실: 3차원 퍼즐',
    '당신의 논리를 시험할 고대 신전. 세상을 잇는 차원의 문을 여는 짜릿한 지적 쾌감을 경험하세요.',
    '북유럽 신화를 배경으로 한 몰입형 퍼즐 게임. 아름다운 비주얼과 도전적인 퍼즐이 기다립니다.',
    18000, 'game-temple.png', 'Puzzle')
ON CONFLICT (id) DO NOTHING;

-- 시퀀스 재설정 (시퀀스가 없으면 무시)
DO $$
BEGIN
  PERFORM setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products));
EXCEPTION
  WHEN undefined_table OR undefined_object THEN
    RAISE NOTICE '시퀀스 products_id_seq가 존재하지 않아 건너뜁니다.';
END $$;


-- ============================================
-- 2. 고객 테이블 (customers)
-- ============================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nickname TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_nickname ON customers(nickname);

-- RLS 설정
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 정책: 먼저 삭제 후 재생성
DROP POLICY IF EXISTS "Users can view their own profile" ON customers;
DROP POLICY IF EXISTS "Users can insert their own profile" ON customers;
DROP POLICY IF EXISTS "Users can update their own profile" ON customers;

CREATE POLICY "Users can view their own profile"
  ON customers
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON customers
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON customers
  FOR UPDATE
  USING (auth.uid() = id);


-- ============================================
-- 3. 주문 테이블 (orders)
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total_price INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'pending', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- 마이그레이션: 기존 orders 테이블에 user_id가 있고
-- customer_id가 없는 경우 → 컬럼명 변경 + FK 재설정
-- ──────────────────────────────────────────────
DO $$
BEGIN
  -- user_id 컬럼이 존재하고 customer_id가 없으면 마이그레이션
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_id'
  ) THEN
    -- 기존 user_id FK 제약조건 삭제 (이름이 다를 수 있으므로 동적 삭제)
    DECLARE
      _con_name TEXT;
    BEGIN
      SELECT constraint_name INTO _con_name
      FROM information_schema.key_column_usage
      WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'user_id'
      LIMIT 1;

      IF _con_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE orders DROP CONSTRAINT %I', _con_name);
        RAISE NOTICE 'orders 테이블: 기존 FK 제약조건 [%] 삭제 완료', _con_name;
      END IF;
    END;

    -- user_id → customer_id 컬럼명 변경
    ALTER TABLE orders RENAME COLUMN user_id TO customer_id;
    RAISE NOTICE 'orders 테이블: user_id → customer_id 컬럼명 변경 완료';

    -- 새 FK 제약조건 추가 (customers 테이블 참조)
    BEGIN
      ALTER TABLE orders
        ADD CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
      RAISE NOTICE 'orders 테이블: customer_id → customers(id) FK 추가 완료';
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'orders 테이블: FK fk_orders_customer 이미 존재하여 건너뜁니다.';
    END;
  ELSE
    RAISE NOTICE 'orders 테이블: 마이그레이션 불필요 (customer_id 이미 존재하거나 user_id 없음)';
  END IF;
END $$;

-- 기존 user_id 인덱스 삭제 (있으면)
DROP INDEX IF EXISTS idx_orders_user_id;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- RLS 설정
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 기존 정책 모두 삭제 (user_id 기반 정책 포함)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;

CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert their own orders"
  ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);


-- ============================================
-- 공통: updated_at 자동 업데이트 함수 & 트리거
-- (CREATE OR REPLACE → 이미 있어도 덮어쓰기)
-- (DROP TRIGGER IF EXISTS → 이미 있어도 안전)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- products 트리거
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- customers 트리거
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- orders 트리거
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- (선택) 회원가입 시 customers 자동 생성 함수
-- auth.users에 새 유저가 생기면 customers에도 자동 추가
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customers (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ============================================
-- 4. 채팅 메시지 테이블 (chat_messages)
-- ============================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- RLS 설정 (비로그인 사용자도 채팅 가능하도록 session_id 기반)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can view their own chat messages" ON chat_messages;

CREATE POLICY "Anyone can insert chat messages"
  ON chat_messages
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view their own chat messages"
  ON chat_messages
  FOR SELECT
  USING (true);

-- 트리거 불필요 (created_at만 사용, updated_at 없음)


COMMIT;

-- ============================================
-- 실행 결과 확인 쿼리
-- ============================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;

-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name IN ('products', 'customers', 'orders')
-- ORDER BY table_name, ordinal_position;
