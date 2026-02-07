import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders } from '@/lib/orderService';
import { Order } from '@/types/order';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Calendar, CreditCard, Package, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrderHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (user) {
        setLoading(true);
        try {
          const userOrders = await getOrders(user.id);
          setOrders(userOrders);
        } catch (error) {
          console.error('주문 내역 로드 오류:', error);
          setOrders([]);
        } finally {
          setLoading(false);
        }
      } else {
        setOrders([]);
        setLoading(false);
      }
    };

    loadOrders();
  }, [user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">완료</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">대기 중</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">취소됨</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div id="order-history">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              주문 내역
            </CardTitle>
            <CardDescription>
              구매한 게임을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">주문 내역을 불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div id="order-history">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              주문 내역
            </CardTitle>
            <CardDescription>
              구매한 게임을 확인하세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mb-2 text-lg font-medium">주문 내역이 없습니다</p>
              <p className="mb-4 text-sm text-muted-foreground">
                아직 구매한 게임이 없습니다.
              </p>
              <Button variant="outline" onClick={() => navigate('/')}>
                쇼핑하러 가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="order-history">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          주문 내역
        </CardTitle>
        <CardDescription>
          총 {orders.length}개의 주문
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border border-border/50 bg-muted/30 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(order.createdAt)}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    주문번호: {order.id.slice(-8).toUpperCase()}
                  </span>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <Separator className="mb-3" />

              <div className="space-y-2 mb-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-md bg-background/50 p-2"
                  >
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.product.category} · 수량: {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gold">
                      ₩{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CreditCard className="h-4 w-4" />
                  <span>결제 완료</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">총 결제 금액</p>
                  <p className="text-lg font-bold text-gold">
                    ₩{order.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
    </div>
  );
};

export default OrderHistory;

