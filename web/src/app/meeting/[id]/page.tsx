'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './MeetingRoom.module.css';

interface TranscriptSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: string;
}

export default function MeetingRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id: meetingId } = React.use(params);
  const [status, setStatus] = useState<'idle' | 'live' | 'ended'>('idle');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [presentationMode, setPresentationMode] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // Setup WebSocket connection
    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onopen = () => {
      console.log('Connected to WebSocket');
      ws.send(JSON.stringify({ type: 'JOIN_MEETING', meetingId }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'TRANSCRIPT_SEGMENT') {
        setSegments((prev) => [...prev, msg.data]);
        
        // Auto-scroll
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      }
    };

    wsRef.current = ws;

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [meetingId]);

  const startMeeting = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus('live');
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          // Send the audio blob chunk to the WebSocket server
          wsRef.current.send(event.data);
        }
      };

      // Start recording and emitting chunks every 1 second
      mediaRecorder.start(1000);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'START_TRANSCRIPTION' }));
      }
    } catch (err) {
      console.error('Microphone access denied', err);
      alert('Microphone access is required to start transcription.');
    }
  };

  const endMeeting = () => {
    setStatus('ended');
    
    // Stop recording and release mic
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'STOP_TRANSCRIPTION' }));
    }
  };

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (presentationMode) {
    return (
      <div className={styles.presentationMode}>
        <button 
          className={styles.presentationExitBtn}
          onClick={() => setPresentationMode(false)}
        >
          Exit Presentation Mode
        </button>
        <div className={styles.transcriptContainer} ref={scrollRef}>
          <div className={styles.segmentsList}>
            {segments.slice(-3).map((seg) => (
              <div key={seg.id} className={styles.segment}>
                <div className={styles.segmentContent}>
                  <div className={styles.segmentHeader}>
                    <span className={styles.speakerName}>{seg.speaker}</span>
                  </div>
                  <p className={styles.text}>{seg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.meetingTitle}>Product Sync: Q3 Roadmap</h1>
          {status === 'live' && <span className={`${styles.statusBadge} ${styles.statusLive}`}>Live</span>}
          {status === 'ended' && <span className={`${styles.statusBadge} ${styles.statusEnded}`}>Ended</span>}
        </div>
        
        <div className={styles.controls}>
          {status === 'idle' && (
            <button className={styles.btnPrimary} onClick={startMeeting}>
              Start Recording
            </button>
          )}
          {status === 'live' && (
            <>
              <button className={styles.btnSecondary} onClick={() => setPresentationMode(true)}>
                Presentation Mode
              </button>
              <button className={styles.btnDanger} onClick={endMeeting}>
                End Meeting
              </button>
            </>
          )}
          {status === 'ended' && (
            <button className={styles.btnPrimary}>
              Export Summary
            </button>
          )}
        </div>
      </header>

      <main className={styles.mainArea}>
        <div className={styles.transcriptContainer} ref={scrollRef}>
          {segments.length === 0 && status !== 'live' ? (
            <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', marginTop: '40px' }}>
              No transcripts yet. Start the meeting to begin.
            </div>
          ) : (
            <div className={styles.segmentsList}>
              {segments.map((seg) => (
                <div key={seg.id} className={styles.segment}>
                  <div className={styles.speakerAvatar}>
                    {seg.speaker.charAt(0)}
                  </div>
                  <div className={styles.segmentContent}>
                    <div className={styles.segmentHeader}>
                      <span className={styles.speakerName}>{seg.speaker}</span>
                      <span className={styles.timestamp}>{formatTime(seg.timestamp)}</span>
                    </div>
                    <p className={styles.text}>{seg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
