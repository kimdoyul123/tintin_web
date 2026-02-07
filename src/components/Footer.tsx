import { Sparkles, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border/30 bg-navy-deep py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" />
            <span className="font-display text-lg font-bold">
              <span className="text-gradient-gold">게미</span>
              <span className="text-primary">마켓</span>
            </span>
          </div>

          {/* Copyright */}
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            Made with <Heart className="h-4 w-4 text-destructive" /> for gamers
          </p>

          {/* Links */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="#" className="transition-colors hover:text-foreground">
              이용약관
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              개인정보처리방침
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              고객센터
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
