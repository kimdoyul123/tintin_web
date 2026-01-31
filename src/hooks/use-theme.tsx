import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'theme';
const DARK_CLASS = 'dark';

export function useTheme() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    // 초기값: 로컬 스토리지에서 가져오거나 시스템 설정 확인
    if (typeof window === 'undefined') return false;
    
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
    
    // 로컬 스토리지에 없으면 시스템 설정 확인
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    
    if (isDark) {
      root.classList.add(DARK_CLASS);
      localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    } else {
      root.classList.remove(DARK_CLASS);
      localStorage.setItem(THEME_STORAGE_KEY, 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return { isDark, toggleTheme };
}

