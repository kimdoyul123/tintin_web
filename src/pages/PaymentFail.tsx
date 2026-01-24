import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PaymentFail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');

  const getErrorMessage = () => {
    if (errorMessage) return errorMessage;
    if (errorCode === 'USER_CANCEL') return '결제가 취소되었습니다.';
    if (errorCode === 'INVALID_CARD') return '유효하지 않은 카드 정보입니다.';
    return '결제 중 오류가 발생했습니다.';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-fantasy p-4">
      <div className="w-full max-w-md rounded-2xl border border-border/50 bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>

          <h1 className="mb-2 font-display text-2xl font-bold text-foreground">
            결제에 실패했습니다
          </h1>

          <p className="mb-6 text-sm text-muted-foreground">
            {getErrorMessage()}
          </p>

          {errorCode && (
            <div className="mb-6 w-full rounded-lg border border-border/50 bg-muted/30 p-4 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">에러 코드:</span>
                  <span className="font-medium text-foreground">{errorCode}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex w-full flex-col gap-3">
            <Button
              variant="magic"
              size="lg"
              onClick={() => navigate(-1)}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              이전 페이지로
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/')}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFail;

