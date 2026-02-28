import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// 초기 다크 모드 설정
const initializeTheme = () => {
  const stored = localStorage.getItem('theme');
  const root = document.documentElement;
  
  if (stored === 'dark') {
    root.classList.add('dark');
  } else if (stored === 'light') {
    root.classList.remove('dark');
  } else {
    // 로컬 스토리지에 없으면 시스템 설정 확인
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
};

// DOM이 로드되기 전에 테마 설정 적용
initializeTheme();

createRoot(document.getElementById("root")!).render(<App />);
