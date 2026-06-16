'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

import { ThemeProvider } from 'next-themes';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed:', err));
    }
  }, []);

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
