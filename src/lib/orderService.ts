import { supabase } from './supabase';
import { Order, OrderItem } from '@/types/order';

// Supabase DB 타입 정의
interface OrderRow {
  id: string;
  user_id: string;
  items: OrderItem[];
  total_price: number;
  status: 'completed' | 'pending' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// OrderRow를 Order로 변환
const rowToOrder = (row: OrderRow): Order => ({
  id: row.id,
  userId: row.user_id,
  items: row.items,
  totalPrice: row.total_price,
  createdAt: row.created_at,
  status: row.status,
});

// Order를 OrderRow로 변환
const orderToRow = (order: Order): Omit<OrderRow, 'id' | 'created_at' | 'updated_at'> => ({
  user_id: order.userId,
  items: order.items,
  total_price: order.totalPrice,
  status: order.status,
});

// 사용자의 주문 내역 가져오기
export const getOrders = async (userId: string): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('주문 내역 조회 실패:', error);
      throw error;
    }

    return (data || []).map(rowToOrder);
  } catch (error) {
    console.error('주문 내역 조회 오류:', error);
    return [];
  }
};

// 주문 생성 및 저장
export const createOrder = async (
  userId: string,
  items: OrderItem[],
  status: Order['status'] = 'completed'
): Promise<Order | null> => {
  try {
    const totalPrice = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderData: Omit<OrderRow, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      items,
      total_price: totalPrice,
      status,
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error('주문 생성 실패:', error);
      throw error;
    }

    return rowToOrder(data);
  } catch (error) {
    console.error('주문 생성 오류:', error);
    return null;
  }
};

// 주문 상태 업데이트
export const updateOrderStatus = async (
  orderId: string,
  status: Order['status']
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('주문 상태 업데이트 실패:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('주문 상태 업데이트 오류:', error);
    return false;
  }
};

