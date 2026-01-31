import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // 스크롤이 300px 이상 내려가면 버튼 표시
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full bg-primary shadow-lg transition-all duration-300 hover:bg-primary/90 hover:scale-110 md:bottom-8 md:right-8 md:h-14 md:w-14"
          aria-label="맨 위로 가기"
        >
          <ArrowUp className="h-5 w-5 md:h-6 md:w-6" />
        </Button>
      )}
    </>
  );
};

export default ScrollToTop;

