import Link from 'next/link';
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
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Your Meetings</h1>
        <Link href="/meeting/new" className={styles.startBtn}>
          <span className={styles.startIcon}>+</span> Start New Meeting
        </Link>
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
