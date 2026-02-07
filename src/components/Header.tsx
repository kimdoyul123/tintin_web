import { Search, ShoppingCart, Sparkles, Sun, Moon, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/contexts/CartContext';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface HeaderProps {
  onCartClick: () => void;
  onSearch: (query: string) => void;
}

const Header = ({ onCartClick, onSearch }: HeaderProps) => {
  const { getTotalItems } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const totalItems = getTotalItems();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 md:h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-gold md:h-8 md:w-8" />
          <h1 className="font-display text-xl font-bold tracking-wide text-foreground md:text-2xl">
            <span className="text-gradient-gold">게미</span>
            <span className="text-primary">마켓</span>
          </h1>
        </Link>

        {/* Search Bar - Hidden on mobile */}
        <form 
          onSubmit={handleSearch}
          className="hidden flex-1 items-center justify-center md:flex"
        >
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="어떤 게임을 찾으시나요?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border-border/50 bg-muted/50 pl-10 pr-4 placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
            />
          </div>
        </form>

        {/* Theme Toggle, Auth & Cart Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative"
            aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {isDark ? (
              <Sun className="h-5 w-5 md:h-6 md:w-6" />
            ) : (
              <Moon className="h-5 w-5 md:h-6 md:w-6" />
            )}
          </Button>
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                    <Link to="/mypage">
                      <User className="h-4 w-4 mr-2" />
                      마이페이지
                    </Link>
                  </Button>
                  <span className="hidden text-sm text-muted-foreground lg:inline max-w-[150px] truncate">
                    {user.email}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    aria-label="로그아웃"
                  >
                    <LogOut className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/signin">로그인</Link>
                  </Button>
                  <Button variant="default" size="sm" asChild>
                    <Link to="/signup">회원가입</Link>
                  </Button>
                </div>
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onCartClick}
            className="relative"
          >
            <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy-deep">
                {totalItems}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Search */}
      <form 
        onSubmit={handleSearch}
        className="border-t border-border/30 px-4 py-3 md:hidden"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="어떤 게임을 찾으시나요?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border-border/50 bg-muted/50 pl-10 pr-4 placeholder:text-muted-foreground"
          />
        </div>
      </form>
    </header>
  );
};

export default Header;
