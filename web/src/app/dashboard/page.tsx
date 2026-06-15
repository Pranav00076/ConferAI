'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './Dashboard.module.css';

// Mock data for MVP
const MOCK_MEETINGS = [
  {
    id: '1',
    title: 'Product Sync: Q3 Roadmap',
    date: 'Oct 24, 2023',
    duration: '45 min',
    summary: 'Discussed the upcoming features for Q3 including real-time collaboration and new export formats. Decided to prioritize the WebSocket refactor.'
  },
  {
    id: '2',
    title: 'Design Review',
    date: 'Oct 22, 2023',
    duration: '30 min',
    summary: 'Reviewed the new dark mode aesthetics and glassmorphism elements. Approved the new color palette.'
  },
  {
    id: '3',
    title: 'Engineering All-Hands',
    date: 'Oct 20, 2023',
    duration: '1h 15m',
    summary: 'Company wide update on engineering metrics, Q2 retrospect, and architecture overview for the new monolith.'
  }
];

export default function DashboardPage() {
  const [joinId, setJoinId] = useState('');

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
        {MOCK_MEETINGS.map((meeting) => (
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
              <Link href={`/meeting/${meeting.id}`} className={styles.actionBtn}>
                View Transcript
              </Link>
              <button className={styles.actionBtn}>
                Export
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
