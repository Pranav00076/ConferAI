'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './MeetingRoom.module.css';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';

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
  const [participants, setParticipants] = useState<string[]>([]);
  const [presentationMode, setPresentationMode] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // Setup WebSocket connection
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${host}:8081`);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket');
      ws.send(JSON.stringify({ type: 'JOIN_MEETING', meetingId }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'TRANSCRIPT_SEGMENT') {
        setSegments((prev) => {
          // Prevent duplicates (common with React StrictMode double connections)
          if (prev.some(s => s.id === msg.data.id)) return prev;
          return [...prev, msg.data];
        });
        
        // Auto-scroll
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      } else if (msg.type === 'PARTICIPANTS_UPDATE') {
        setParticipants(msg.data);
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [meetingId]);

  const startMeeting = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser blocks microphone access on unsecure HTTP connections. To test cross-device, use localhost or a secure tunnel like ngrok.");
        return;
      }
      
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

  const exportTxt = () => {
    const content = segments.map(s => `[${formatTime(s.timestamp)}] ${s.speaker}: ${s.text}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `meeting_${meetingId}.txt`);
  };

  const exportDocx = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: segments.map(s => 
          new Paragraph({
            children: [
              new TextRun({ text: `[${formatTime(s.timestamp)}] ${s.speaker}: `, bold: true }),
              new TextRun(s.text)
            ]
          })
        )
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `meeting_${meetingId}.docx`);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Meeting Transcript: ${meetingId}`, 10, 10);
    doc.setFontSize(12);
    let y = 20;
    segments.forEach(s => {
      const line = `[${formatTime(s.timestamp)}] ${s.speaker}: ${s.text}`;
      const splitText = doc.splitTextToSize(line, 180);
      doc.text(splitText, 10, y);
      y += 7 * splitText.length;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`meeting_${meetingId}.pdf`);
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
        <div>
          <div className={styles.titleGroup}>
            <h1 className={styles.meetingTitle}>Product Sync: Q3 Roadmap</h1>
            {status === 'live' && <span className={`${styles.statusBadge} ${styles.statusLive}`}>Live</span>}
            {status === 'ended' && <span className={`${styles.statusBadge} ${styles.statusEnded}`}>Ended</span>}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
            {participants.length} participant(s) in room: {participants.join(', ')}
          </div>
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className={styles.btnSecondary} onClick={exportTxt}>Export TXT</button>
              <button className={styles.btnSecondary} onClick={exportDocx}>Export DOCX</button>
              <button className={styles.btnPrimary} onClick={exportPdf}>Export PDF</button>
            </div>
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
