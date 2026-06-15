'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  
  // Mock auth state for MVP UI before NextAuth is fully wired up
  const session = null; 

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <span className={styles.logoIcon}>⚡</span> ConferAI
      </Link>
      
      <nav className={styles.nav}>
        <Link 
          href="/dashboard" 
          className={styles.navLink}
          style={{ color: pathname === '/dashboard' ? 'var(--brand-primary)' : '' }}
        >
          Dashboard
        </Link>
        <Link 
          href="/settings" 
          className={styles.navLink}
          style={{ color: pathname === '/settings' ? 'var(--brand-primary)' : '' }}
        >
          Settings
        </Link>
      </nav>

      <div className={styles.actions}>
        {session ? (
          <div className={styles.userProfile}>
            <div className={styles.avatar}>U</div>
            <span>User</span>
          </div>
        ) : (
          <button className={styles.loginBtn}>Sign In</button>
        )}
      </div>
    </header>
  );
}
