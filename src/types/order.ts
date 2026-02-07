import { Product } from '@/data/products';

export interface OrderItem {
  product: Product;
  quantity: number;
  price: number; // 구매 당시 가격
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalPrice: number;
  createdAt: string;
  status: 'completed' | 'pending' | 'cancelled';
}

