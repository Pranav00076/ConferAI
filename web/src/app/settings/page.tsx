'use client';

import React, { useEffect, useState } from 'react';
import styles from './Settings.module.css';

export default function SettingsPage() {
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('');

  useEffect(() => {
    // Request permission to see device labels, then enumerate devices
    const fetchDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setMics(audioInputs);

        const savedMic = localStorage.getItem('preferredMicId');
        if (savedMic && audioInputs.some(m => m.deviceId === savedMic)) {
          setSelectedMic(savedMic);
        } else if (audioInputs.length > 0) {
          setSelectedMic(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error("Error fetching media devices", err);
      }
    };
    fetchDevices();
  }, []);

  const handleMicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deviceId = e.target.value;
    setSelectedMic(deviceId);
    localStorage.setItem('preferredMicId', deviceId);
  };

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
          <select className={styles.select} value={selectedMic} onChange={handleMicChange}>
            {mics.length === 0 && <option value="">Loading devices...</option>}
            {mics.map((mic) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Microphone ${mic.deviceId.substring(0, 5)}...`}
              </option>
            ))}
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
