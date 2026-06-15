'use client';

import styles from './Settings.module.css';

export default function SettingsPage() {
  return (
    <main className={styles.container}>
      <h1 className={styles.title}>Settings</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Appearance</h2>
        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Theme</div>
            <div className={styles.settingDesc}>Choose your preferred interface theme.</div>
          </div>
          <select className={styles.select} defaultValue="dark">
            <option value="dark">Dark Mode</option>
            <option value="light">Light Mode</option>
            <option value="system">System</option>
          </select>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Audio & Transcription</h2>
        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Default Microphone</div>
            <div className={styles.settingDesc}>Select the default input device for new meetings.</div>
          </div>
          <select className={styles.select}>
            <option>Default - MacBook Pro Microphone</option>
            <option>External USB Mic</option>
          </select>
        </div>
        <div className={styles.settingRow}>
          <div>
            <div className={styles.settingLabel}>Auto-Summary</div>
            <div className={styles.settingDesc}>Generate summaries automatically after meetings.</div>
          </div>
          <div className={styles.toggle}></div>
        </div>
      </section>

      <button className={styles.saveBtn}>Save Preferences</button>
    </main>
  );
}
