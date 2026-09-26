import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('nuvia-theme');
      if (saved) return saved === 'dark';
    } catch {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    try { localStorage.setItem('nuvia-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);

  return { dark, toggle: () => setDark(d => !d) };
}
