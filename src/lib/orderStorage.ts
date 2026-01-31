import { Order, OrderItem } from '@/types/order';

const ORDERS_STORAGE_KEY = 'game-market-orders';

// 주문 내역을 로컬 스토리지에서 가져오기
export const getOrders = (userId: string): Order[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (stored) {
      const allOrders: Order[] = JSON.parse(stored);
      return allOrders.filter(order => order.userId === userId);
    }
  } catch (error) {
    console.error('주문 내역 로드 실패:', error);
  }
  return [];
};

// 주문 내역 저장
export const saveOrder = (order: Order): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
    let allOrders: Order[] = stored ? JSON.parse(stored) : [];
    
    // 새 주문 추가
    allOrders.push(order);
    
    // 최신 순으로 정렬
    allOrders.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(allOrders));
  } catch (error) {
    console.error('주문 내역 저장 실패:', error);
  }
};

// 주문 생성
export const createOrder = (
  userId: string,
  items: OrderItem[],
  status: Order['status'] = 'completed'
): Order => {
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const order: Order = {
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    items,
    totalPrice,
    createdAt: new Date().toISOString(),
    status,
  };

  saveOrder(order);
  return order;
};

