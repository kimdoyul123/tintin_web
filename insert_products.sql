-- ============================================
-- 샘플 데이터 INSERT
-- 상품 5개 + 고객 3명 + 주문 2개
-- Supabase SQL Editor에 복사하여 실행하세요
-- ============================================

-- FK 체크 일시 비활성화 (샘플 데이터용)
SET session_replication_role = 'replica';


-- ============================================
-- 1. 상품 데이터 (products.json 기반)
-- ============================================

INSERT INTO products (id, name, slogan, description, price, image_url, category) VALUES
(1,
  '더 미라지 크로니클: 얼티밋 에디션',
  '당신이 기다려온 ''차세대'' 대서사시. 현실을 잊게 할 압도적인 몰입감을 경험하세요.',
  '광활한 판타지 세계에서 펼쳐지는 장대한 스토리. 수백 시간의 콘텐츠와 숨막히는 비주얼이 당신을 기다립니다.',
  79000, 'game-mirage.png', 'RPG'),

(2,
  '포근한 농장의 하루: 힐링 시뮬레이터',
  '복잡한 일상에서 잠시 로그아웃! 흙 내음 가득한 나만의 작은 행복을 가꿔보세요.',
  '귀여운 동물들과 함께하는 평화로운 농장 생활. 스트레스 없이 마음을 편안하게 해주는 힐링 게임입니다.',
  24000, 'game-farm.png', 'Simulation'),

(3,
  '다크니스 던전 3 (리마스터)',
  '전설이 돌아왔다. 그때의 심장은 그대로, 그래픽은 더 선명하게! 명작의 무게를 다시 느껴보세요.',
  '클래식 던전 크롤러의 귀환. 현대적인 그래픽과 개선된 전투 시스템으로 재탄생했습니다.',
  35000, 'game-dungeon.png', 'Classic'),

(4,
  '갤럭시 워로드: 팀 배틀 패키지',
  '솔로는 없다! 친구와 함께 우주를 정복하라. 치열한 전략과 팀워크로 승리의 쾌감을 맛보세요.',
  '대규모 우주 전투를 경험하세요. 함대를 지휘하고 동맹을 맺어 은하계의 패권을 차지하세요.',
  45000, 'game-galaxy.png', 'Strategy'),

(5,
  '템플 오브 이그드라실: 3차원 퍼즐',
  '당신의 논리를 시험할 고대 신전. 세상을 잇는 차원의 문을 여는 짜릿한 지적 쾌감을 경험하세요.',
  '북유럽 신화를 배경으로 한 몰입형 퍼즐 게임. 아름다운 비주얼과 도전적인 퍼즐이 기다립니다.',
  18000, 'game-temple.png', 'Puzzle')
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 2. 고객 샘플 데이터 (3명)
-- ============================================

INSERT INTO customers (id, email, nickname, phone, address) VALUES
('a1b2c3d4-1111-4000-a000-000000000001',
  'kim.minjun@example.com', '김민준', '010-1234-5678',
  '서울특별시 강남구 테헤란로 123'),

('a1b2c3d4-2222-4000-a000-000000000002',
  'lee.soyeon@example.com', '이소연', '010-9876-5432',
  '부산광역시 해운대구 해운대로 456'),

('a1b2c3d4-3333-4000-a000-000000000003',
  'park.jihoon@example.com', '박지훈', '010-5555-7777',
  '대전광역시 유성구 대학로 789')
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 3. 주문 샘플 데이터 (2개)
-- ============================================

INSERT INTO orders (id, customer_id, items, total_price, status) VALUES
('b1b2c3d4-0001-4000-b000-000000000001',
  'a1b2c3d4-1111-4000-a000-000000000001',
  '[
    {
      "product": {
        "id": 1,
        "name": "더 미라지 크로니클: 얼티밋 에디션",
        "slogan": "당신이 기다려온 차세대 대서사시.",
        "description": "광활한 판타지 세계에서 펼쳐지는 장대한 스토리.",
        "price": 79000,
        "imageUrl": "game-mirage.png",
        "category": "RPG"
      },
      "quantity": 1,
      "price": 79000
    },
    {
      "product": {
        "id": 2,
        "name": "포근한 농장의 하루: 힐링 시뮬레이터",
        "slogan": "복잡한 일상에서 잠시 로그아웃!",
        "description": "귀여운 동물들과 함께하는 평화로운 농장 생활.",
        "price": 24000,
        "imageUrl": "game-farm.png",
        "category": "Simulation"
      },
      "quantity": 1,
      "price": 24000
    }
  ]'::jsonb,
  103000,
  'completed')
ON CONFLICT (id) DO NOTHING;

INSERT INTO orders (id, customer_id, items, total_price, status) VALUES
('b1b2c3d4-0002-4000-b000-000000000002',
  'a1b2c3d4-2222-4000-a000-000000000002',
  '[
    {
      "product": {
        "id": 4,
        "name": "갤럭시 워로드: 팀 배틀 패키지",
        "slogan": "솔로는 없다! 친구와 함께 우주를 정복하라.",
        "description": "대규모 우주 전투를 경험하세요.",
        "price": 45000,
        "imageUrl": "game-galaxy.png",
        "category": "Strategy"
      },
      "quantity": 2,
      "price": 45000
    }
  ]'::jsonb,
  90000,
  'pending')
ON CONFLICT (id) DO NOTHING;


-- FK 체크 다시 활성화
SET session_replication_role = 'origin';


-- ============================================
-- 4. 삽입 결과 확인 (이 SELECT가 최종 출력됩니다)
-- ============================================

SELECT
  '상품' AS 테이블,
  COUNT(*) AS 전체건수,
  (SELECT COUNT(*) FROM products WHERE id IN (1,2,3,4,5)) AS 샘플건수
FROM products

UNION ALL

SELECT
  '고객' AS 테이블,
  COUNT(*) AS 전체건수,
  (SELECT COUNT(*) FROM customers WHERE id IN (
    'a1b2c3d4-1111-4000-a000-000000000001',
    'a1b2c3d4-2222-4000-a000-000000000002',
    'a1b2c3d4-3333-4000-a000-000000000003'
  )) AS 샘플건수
FROM customers

UNION ALL

SELECT
  '주문' AS 테이블,
  COUNT(*) AS 전체건수,
  (SELECT COUNT(*) FROM orders WHERE id IN (
    'b1b2c3d4-0001-4000-b000-000000000001',
    'b1b2c3d4-0002-4000-b000-000000000002'
  )) AS 샘플건수
FROM orders;
