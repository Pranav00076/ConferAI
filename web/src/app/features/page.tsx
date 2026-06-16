import Link from 'next/link';
import styles from './Features.module.css';
import trans from "./Transcription.png"

export const metadata = {
  title: 'Features - ConferAI',
  description: 'Explore the powerful features of ConferAI: Real-Time Captioning, Speaker Diarization, and Smart Summaries.',
};

export default function FeaturesPage() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Everything You Need for Smarter Meetings</h1>
        <p className={styles.subtitle}>
          ConferAI is built with cutting-edge AI technologies to make your conferences, lectures, and daily standups more accessible and productive.
        </p>
      </header>

      <div className={styles.featuresList}>
        <section className={styles.featureRow}>
          <div className={styles.featureContent}>
            <div className={styles.featureIconWrapper}>🎤</div>
            <h2 className={styles.featureTitle}>Real-Time Captioning</h2>
            <p className={styles.featureDescription}>
              Never miss a single word. ConferAI provides highly accurate, low-latency live captions directly on your screen. Perfect for large auditoriums, online webinars, or hybrid environments where accessibility is a priority.
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureListItem}>Sub-second latency for natural reading</li>
              <li className={styles.featureListItem}>High accuracy across multiple accents</li>
              <li className={styles.featureListItem}>Fullscreen &quot;Presentation Mode&quot; for easy viewing</li>
            </ul>
          </div>
          <div className={styles.featureImage}>
            <img src={trans.src} alt="Transcription" width={550} height={350} className={styles.featureImg} />
          </div>
        </section>

        <section className={styles.featureRow}>
          <div className={styles.featureContent}>
            <div className={styles.featureIconWrapper}>👥</div>
            <h2 className={styles.featureTitle}>Speaker Diarization</h2>
            <p className={styles.featureDescription}>
              Automatically detect and distinguish between different speakers in the same room or call. ConferAI assigns labels to each voice, ensuring the transcript makes perfect sense even in a crowded panel discussion.
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureListItem}>Automatic voice fingerprinting</li>
              <li className={styles.featureListItem}>Color-coded speaker timelines</li>
              <li className={styles.featureListItem}>Edit and assign names to speakers post-meeting</li>
            </ul>
          </div>
          <div className={styles.featureImage}>
            <img src={trans.src} alt="Transcription" width={550} height={350} className={styles.featureImg} />
          </div>
        </section>

        <section className={styles.featureRow}>
          <div className={styles.featureContent}>
            <div className={styles.featureIconWrapper}>📝</div>
            <h2 className={styles.featureTitle}>Smart AI Summaries</h2>
            <p className={styles.featureDescription}>
              Stop worrying about taking notes. Once your meeting concludes, our AI models generate comprehensive summaries, extracting key takeaways, critical decisions, and assigned action items automatically.
            </p>
            <ul className={styles.featureList}>
              <li className={styles.featureListItem}>Bullet-point executive summaries</li>
              <li className={styles.featureListItem}>Action item extraction with assignees</li>
              <li className={styles.featureListItem}>Export to PDF, DOCX, or copy to clipboard</li>
            </ul>
          </div>
          <div className={styles.featureImage}>
            <img src={trans.src} alt="Transcription" width={550} height={350} className={styles.featureImg} />

          </div>
        </section>
      </div>

      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Ready to transform your meetings?</h2>
        <p className={styles.ctaText}>Join thousands of professionals using ConferAI today.</p>
        <Link href="/dashboard" className={styles.ctaBtn}>
          Start for Free
        </Link>
      </section>
    </main>
  );
}
