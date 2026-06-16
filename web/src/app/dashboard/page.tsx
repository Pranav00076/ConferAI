'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Dashboard.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface SavedMeeting {
  id: string;
  meetingId: string;
  title: string;
  date: string;
  duration: string;
  summary: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [joinId, setJoinId] = useState('');
  const [meetings, setMeetings] = useState<SavedMeeting[]>([]);

  useEffect(() => {
    if (loading || !user) return;

    const q = query(
      collection(db, 'meetings'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMeetings = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedMeeting[];
      setMeetings(fetchedMeetings);
    });

    return () => unsubscribe();
  }, [user, loading]);

  const handleStartNew = () => {
    // Generate a random 6-character meeting ID
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    window.location.href = `/meeting/${newId}`;
  };

  const handleJoin = () => {
    if (joinId.trim()) {
      window.location.href = `/meeting/${joinId.trim()}`;
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Enter Room ID" 
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
            <button 
              className={styles.actionBtn} 
              onClick={handleJoin}
              style={{ padding: '0 24px', background: 'var(--bg-tertiary)' }}
            >
              Join
            </button>
          </div>
          <button className={styles.startBtn} onClick={handleStartNew}>
            <span className={styles.startIcon}>+</span> Start New Meeting
          </button>
          <Link href="/meeting/local" className={styles.startBtn} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--brand-primary)', color: 'var(--brand-primary)' }}>
            <span className={styles.startIcon}>📡</span> Find on WiFi
          </Link>
        </div>
      </header>

      <div className={styles.grid}>
        {meetings.length === 0 && !loading && (
          <div style={{ color: 'var(--text-tertiary)' }}>No saved meetings yet. Join a room and click &quot;Save Meeting&quot;!</div>
        )}
        {meetings.map((meeting) => (
          <div key={meeting.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <h3 className={styles.cardTitle}>{meeting.title}</h3>
                <span className={styles.cardDate}>{meeting.date}</span>
              </div>
              <span className={styles.cardDuration}>{meeting.duration}</span>
            </div>
            
            <div className={styles.cardBody}>
              <p className={styles.summaryPreview}>{meeting.summary}</p>
            </div>
            
            <div className={styles.cardFooter}>
              <Link href={`/saved/${meeting.id}`} className={styles.actionBtn}>
                View Transcript
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
