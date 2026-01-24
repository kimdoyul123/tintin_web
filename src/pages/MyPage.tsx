import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { User, Mail, Calendar, LogOut, Shield, Edit, Lock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartSheet from '@/components/CartSheet';
import AccountEditDialog from '@/components/AccountEditDialog';
import OrderHistory from '@/components/OrderHistory';
import { useCart } from '@/contexts/CartContext';

const MyPage = () => {
  const { user, signOut } = useAuth();
  const { clearCart } = useCart();
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState<'email' | 'password'>('email');

  const handleSignOut = async () => {
    await signOut();
    clearCart();
    toast({
      title: '로그아웃 완료',
      description: '로그아웃되었습니다.',
    });
    navigate('/');
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-fantasy">
      <Header onCartClick={() => setIsCartOpen(true)} onSearch={handleSearch} />
      
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* 프로필 헤더 */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="h-20 w-20 md:h-24 md:w-24">
                  <AvatarFallback className="text-2xl md:text-3xl bg-primary text-primary-foreground">
                    {getInitials(user.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="text-2xl md:text-3xl mb-2">마이페이지</CardTitle>
                  <CardDescription className="text-base">
                    계정 정보를 확인하고 관리하세요
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 계정 정보 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                계정 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">이메일</p>
                  <p className="text-base">{user.email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-4">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">가입일</p>
                  <p className="text-base">
                    {user.created_at ? formatDate(user.created_at) : '정보 없음'}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-4">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-1">이메일 인증 상태</p>
                  <p className="text-base">
                    {user.email_confirmed_at ? (
                      <span className="text-green-600 dark:text-green-400">인증 완료</span>
                    ) : (
                      <span className="text-yellow-600 dark:text-yellow-400">인증 대기 중</span>
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 계정 관리 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                계정 관리
              </CardTitle>
              <CardDescription>
                계정 정보를 수정하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setEditMode('email');
                  setEditDialogOpen(true);
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                이메일 변경
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  setEditMode('password');
                  setEditDialogOpen(true);
                }}
              >
                <Lock className="mr-2 h-4 w-4" />
                비밀번호 변경
              </Button>
            </CardContent>
          </Card>

          {/* 주문 내역 */}
          <div className="mb-6">
            <OrderHistory />
          </div>

          {/* 로그아웃 버튼 */}
          <Card className="mt-6 border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">위험한 작업</CardTitle>
              <CardDescription>
                로그아웃하면 현재 세션이 종료됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="w-full md:w-auto"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                로그아웃
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      {/* 빠른 액세스 버튼: 화면 우하단에 항상 표시 (로그인 상태일 때만) */}
      {user && (
        <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-3">
          <Button
            variant="glow"
            className="hidden md:inline-flex items-center gap-2"
            onClick={() => {
              setEditMode('email');
              setEditDialogOpen(true);
            }}
          >
            계정 수정
          </Button>
          <Button
            variant="outline"
            className="inline-flex items-center gap-2"
            onClick={() => {
              const el = document.querySelector('#order-history');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else {
                // 포커스가 없으면 주문 내역 다이렉트로 연다 (OrderHistory가 비어있지 않으면)
                navigate('/mypage');
              }
            }}
          >
            주문 내역
          </Button>
        </div>
      )}
      <AccountEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        mode={editMode}
      />
    </div>
  );
};

export default MyPage;

