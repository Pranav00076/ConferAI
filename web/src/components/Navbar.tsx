'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const { user, signInWithGoogle, logOut, loading } = useAuth(); 

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo} style={{ gap: '12px' }}>
        <Image src="/ConferLogo.png" alt="ConferAI Logo" width={32} height={32} style={{ objectFit: 'contain' }} />
        ConferAI
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
        {loading ? (
          <span>Loading...</span>
        ) : user ? (
          <div className={styles.userProfile} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={styles.avatar}>{user.displayName?.charAt(0) || 'U'}</div>
            <span>{user.displayName || 'User'}</span>
            <button onClick={logOut} className={styles.loginBtn} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', marginLeft: '8px' }}>Logout</button>
          </div>
        ) : (
          <button onClick={signInWithGoogle} className={styles.loginBtn}>Sign In</button>
        )}
      </div>
    </header>
  );
}
