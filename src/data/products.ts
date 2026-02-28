import gameMirage from '@/assets/game-mirage.png';
import gameFarm from '@/assets/game-farm.png';
import gameDungeon from '@/assets/game-dungeon.png';
import gameGalaxy from '@/assets/game-galaxy.png';
import gameTemple from '@/assets/game-temple.png';

export interface Product {
  id: number;
  name: string;
  slogan: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
}

export const products: Product[] = [
  {
    id: 1,
    name: "더 미라지 크로니클: 얼티밋 에디션",
    slogan: "당신이 기다려온 '차세대' 대서사시. 현실을 잊게 할 압도적인 몰입감을 경험하세요.",
    description: "광활한 판타지 세계에서 펼쳐지는 장대한 스토리. 수백 시간의 콘텐츠와 숨막히는 비주얼이 당신을 기다립니다.",
    price: 79000,
    imageUrl: gameMirage,
    category: "RPG",
  },
  {
    id: 2,
    name: "포근한 농장의 하루: 힐링 시뮬레이터",
    slogan: "복잡한 일상에서 잠시 로그아웃! 흙 내음 가득한 나만의 작은 행복을 가꿔보세요.",
    description: "귀여운 동물들과 함께하는 평화로운 농장 생활. 스트레스 없이 마음을 편안하게 해주는 힐링 게임입니다.",
    price: 24000,
    imageUrl: gameFarm,
    category: "Simulation",
  },
  {
    id: 3,
    name: "다크니스 던전 3 (리마스터)",
    slogan: "전설이 돌아왔다. 그때의 심장은 그대로, 그래픽은 더 선명하게! 명작의 무게를 다시 느껴보세요.",
    description: "클래식 던전 크롤러의 귀환. 현대적인 그래픽과 개선된 전투 시스템으로 재탄생했습니다.",
    price: 35000,
    imageUrl: gameDungeon,
    category: "Classic",
  },
  {
    id: 4,
    name: "갤럭시 워로드: 팀 배틀 패키지",
    slogan: "솔로는 없다! 친구와 함께 우주를 정복하라. 치열한 전략과 팀워크로 승리의 쾌감을 맛보세요.",
    description: "대규모 우주 전투를 경험하세요. 함대를 지휘하고 동맹을 맺어 은하계의 패권을 차지하세요.",
    price: 45000,
    imageUrl: gameGalaxy,
    category: "Strategy",
  },
  {
    id: 5,
    name: "템플 오브 이그드라실: 3차원 퍼즐",
    slogan: "당신의 논리를 시험할 고대 신전. 세상을 잇는 차원의 문을 여는 짜릿한 지적 쾌감을 경험하세요.",
    description: "북유럽 신화를 배경으로 한 몰입형 퍼즐 게임. 아름다운 비주얼과 도전적인 퍼즐이 기다립니다.",
    price: 18000,
    imageUrl: gameTemple,
    category: "Puzzle",
  },
];
