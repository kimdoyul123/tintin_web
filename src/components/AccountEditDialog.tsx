import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AccountEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'email' | 'password';
}

const AccountEditDialog = ({ open, onOpenChange, mode }: AccountEditDialogProps) => {
  const { user, updateEmail, updatePassword, refreshUser } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'email') {
      if (!email || email === user?.email) {
        toast({
          title: '입력 오류',
          description: '새로운 이메일을 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast({
          title: '이메일 형식 오류',
          description: '올바른 이메일 형식을 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);
      try {
        const { error } = await updateEmail(email);
        if (error) {
          toast({
            title: '이메일 변경 실패',
            description: error.message || '이메일 변경에 실패했습니다.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: '이메일 변경 성공',
            description: '새 이메일로 인증 메일이 발송되었습니다. 확인 후 새 이메일로 로그인해주세요.',
          });
          await refreshUser();
          onOpenChange(false);
          setEmail('');
        }
      } catch (err) {
        toast({
          title: '오류 발생',
          description: '예기치 않은 오류가 발생했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    } else {
      // 비밀번호 변경
      if (!newPassword || !confirmPassword) {
        toast({
          title: '입력 오류',
          description: '모든 필드를 입력해주세요.',
          variant: 'destructive',
        });
        return;
      }

      if (newPassword.length < 6) {
        toast({
          title: '비밀번호 길이',
          description: '비밀번호는 최소 6자 이상이어야 합니다.',
          variant: 'destructive',
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: '비밀번호 불일치',
          description: '새 비밀번호가 일치하지 않습니다.',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);
      try {
        const { error } = await updatePassword(newPassword);
        if (error) {
          toast({
            title: '비밀번호 변경 실패',
            description: error.message || '비밀번호 변경에 실패했습니다.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: '비밀번호 변경 성공',
            description: '비밀번호가 성공적으로 변경되었습니다.',
          });
          onOpenChange(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      } catch (err) {
        toast({
          title: '오류 발생',
          description: '예기치 않은 오류가 발생했습니다.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'email' ? '이메일 변경' : '비밀번호 변경'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'email'
              ? '새로운 이메일 주소를 입력하세요. 변경 후 새 이메일로 인증 메일이 발송됩니다.'
              : '새로운 비밀번호를 입력하세요. 최소 6자 이상이어야 합니다.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {mode === 'email' ? (
              <div className="space-y-2">
                <Label htmlFor="email">새 이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="최소 6자 이상"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    required
                    minLength={6}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'email' ? '이메일 변경' : '비밀번호 변경'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountEditDialog;

