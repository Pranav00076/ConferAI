'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '../../meeting/[id]/MeetingRoom.module.css'; // Reuse meeting room styles
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface SavedMeeting {
  id: string;
  meetingId: string;
  title: string;
  date: string;
  duration: string;
  summary: string;
  transcript: string;
}

export default function SavedMeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { user, loading } = useAuth();
  const [meeting, setMeeting] = useState<SavedMeeting | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading || !user) return;

    const fetchMeeting = async () => {
      try {
        const docRef = doc(db, 'meetings', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.userId !== user.uid) {
            setError('Unauthorized access.');
            return;
          }
          setMeeting({ id: docSnap.id, ...data } as SavedMeeting);
        } else {
          setError('Meeting not found.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load meeting.');
      }
    };

    fetchMeeting();
  }, [id, user, loading]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>;
  if (!meeting) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading transcript...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.meetingTitle}>{meeting.title}</h1>
          <span className={`${styles.statusBadge} ${styles.statusEnded}`}>Saved</span>
        </div>
        <div className={styles.controls}>
          <Link href="/dashboard" className={styles.btnSecondary}>
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className={styles.mainArea}>
        <div className={styles.transcriptContainer}>
          <div style={{ maxWidth: '900px', margin: '0 auto', marginBottom: '40px' }}>
            <div style={{ padding: '24px', background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Summary</h2>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{meeting.summary}</ReactMarkdown>
              </div>
              <div style={{ marginTop: '16px', fontSize: '0.875rem', color: 'var(--text-tertiary)', display: 'flex', gap: '16px' }}>
                <span>📅 {meeting.date}</span>
                <span>⏱️ {meeting.duration}</span>
                <span>🔑 Room: {meeting.meetingId}</span>
              </div>
            </div>

            <h3 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Full Transcript</h3>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, color: 'var(--text-primary)', fontSize: '1.125rem' }}>
              {meeting.transcript}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
