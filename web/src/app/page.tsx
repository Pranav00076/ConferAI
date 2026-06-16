import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroBackground}></div>
        <div className={`${styles.content} animate-fade-in`}>
          <h1 className={styles.title}>Never Miss a Word of Your Meetings</h1>
          <p className={styles.subtitle}>
            ConferAI provides real-time, highly accurate transcription and smart summarization for conferences, 
            meetings, and large-scale presentations.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/dashboard" className={styles.btnPrimary}>
              Get Started for Free
            </Link>
            <Link href="/features" className={styles.btnSecondary}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className={styles.features}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎤</div>
            <h3 className={styles.featureTitle}>Real-Time Captioning</h3>
            <p className={styles.featureText}>
              Live captions displayed on a fullscreen &quot;Presentation Mode&quot; to make your events more accessible.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>👥</div>
            <h3 className={styles.featureTitle}>Speaker Diarization</h3>
            <p className={styles.featureText}>
              Automatically detect and label who is speaking during multi-person conferences.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📝</div>
            <h3 className={styles.featureTitle}>Smart Summaries</h3>
            <p className={styles.featureText}>
              Get auto-generated key takeaways, decisions, and action items instantly after the meeting ends.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
