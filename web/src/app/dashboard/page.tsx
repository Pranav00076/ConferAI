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
        <h1 className={styles.title}>Your Meetings</h1>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Enter Meeting ID..." 
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleJoin(); }}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '8px', 
                border: '1px solid var(--border-color)', 
                background: 'var(--bg-secondary)', 
                color: 'var(--text-primary)',
                outline: 'none',
                minWidth: '200px'
              }}
            />
            <button onClick={handleJoin} className={styles.startBtn} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              Join
            </button>
          </div>
          <button onClick={handleStartNew} className={styles.startBtn}>
            <span className={styles.startIcon}>+</span> Start New Meeting
          </button>
        </div>
      </header>

      <div className={styles.grid}>
        {meetings.length === 0 && !loading && (
          <div style={{ color: 'var(--text-tertiary)' }}>No saved meetings yet. Join a room and click "Save Meeting"!</div>
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
              <Link href={`/meeting/${meeting.meetingId}`} className={styles.actionBtn}>
                View Transcript
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
