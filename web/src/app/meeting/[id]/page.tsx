'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './MeetingRoom.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { saveAs } from 'file-saver';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import jsPDF from 'jspdf';

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  visible: boolean;
}

interface TranscriptSegment {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: string;
  isVisible: boolean;
}

export default function MeetingRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id: meetingId } = React.use(params);
  const { user, loading } = useAuth();
  const [myId] = useState(() => Math.random().toString(36).substring(7));
  const [status, setStatus] = useState<'idle' | 'live' | 'ended'>('idle');
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [presentationMode, setPresentationMode] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [customName, setCustomName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (loading) return; // Wait for Firebase Auth to initialize before connecting

    // Setup WebSocket connection
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Use the explicit Vercel environment variable if provided (for production)
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || `${protocol}//${host}:8081`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket');
      ws.send(JSON.stringify({ 
        type: 'JOIN_MEETING', 
        meetingId,
        clientId: myId,
        displayName: user?.displayName || 'Guest'
      }));
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
      mediaRecorderRef.current?.stop();
      ws.close();
    };
  }, [meetingId, loading]);

  // Sync Firebase profile name if the user logs in after joining
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && user?.displayName) {
      wsRef.current.send(JSON.stringify({ type: 'RENAME_DEVICE', name: user.displayName }));
    }
  }, [user?.displayName]);

  // Auto-scroll to bottom when new segments arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [segments]);

  const startMeeting = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser blocks microphone access on unsecure HTTP connections. To test cross-device, use localhost or a secure tunnel like ngrok.");
        return;
      }
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus('live');

      // Do NOT specify a mimeType. iOS Safari does not support webm/opus.
      // Letting the browser pick its native format ensures cross-device compatibility.
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          // Send the audio blob chunk to the WebSocket server
          wsRef.current.send(event.data);
        }
      };

      // Start recording and emitting chunks every 1 second
      mediaRecorderRef.current.start(1000);

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

  const saveMeeting = async () => {
    if (!user) {
      alert("You must be logged in to save meetings.");
      return;
    }
    const name = prompt("Enter a name for this meeting:", `Meeting ${meetingId}`);
    if (!name) return;

    setIsSaving(true);
    try {
      const allText = segments.map(s => `${s.speakerName || s.speakerId}: ${s.text}`).join('\n');
      const summary = allText.length > 150 ? allText.substring(0, 150) + '...' : allText || "No transcript recorded.";
      
      const duration = segments.length > 0 ? formatTime(segments[segments.length - 1].timestamp) : '0 min';

      await addDoc(collection(db, 'meetings'), {
        userId: user.uid,
        meetingId: meetingId,
        title: name,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        duration: duration,
        summary: summary,
        createdAt: serverTimestamp()
      });
      alert("Meeting saved to your dashboard!");
    } catch (err) {
      console.error(err);
      alert("Failed to save meeting. Check your Firestore configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const exportTxt = () => {
    const content = segments.map(s => `[${formatTime(s.timestamp)}] ${s.speakerName || s.speakerId}: ${s.text}`).join('\n\n');
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
              new TextRun({ text: `[${formatTime(s.timestamp)}] ${s.speakerName || s.speakerId}: `, bold: true }),
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
      const line = `[${formatTime(s.timestamp)}] ${s.speakerName || s.speakerId}: ${s.text}`;
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
            {segments.filter(s => s.isVisible !== false).slice(-3).map((seg) => (
              <div key={seg.id} className={styles.segment}>
                <div className={styles.segmentContent}>
                  <div className={styles.segmentHeader}>
                    <span className={styles.speakerName}>{seg.speakerName || seg.speakerId}</span>
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
            <h1 className={styles.meetingTitle}>Room: {meetingId}</h1>
            {status === 'live' && <span className={`${styles.statusBadge} ${styles.statusLive}`}>Live</span>}
            {status === 'ended' && <span className={`${styles.statusBadge} ${styles.statusEnded}`}>Ended</span>}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '8px' }}>
            {(() => {
              const amIHost = participants.find(p => p.id === myId)?.isHost;
              const myParticipant = participants.find(p => p.id === myId);
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <strong>Participants ({participants.length}):</strong>
                    {!amIHost && <button onClick={() => wsRef.current?.send(JSON.stringify({type: 'CLAIM_HOST'}))} style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--brand-primary)', color: '#fff' }}>Claim Host</button>}
                    {myParticipant && !editingName && (
                      <button onClick={() => { setCustomName(myParticipant.name); setEditingName(true); }} style={{ textDecoration: 'underline' }}>Rename Me</button>
                    )}
                    {editingName && (
                      <span style={{ display: 'flex', gap: '4px' }}>
                        <input value={customName} onChange={e => setCustomName(e.target.value)} onKeyDown={e => {
                          if (e.key === 'Enter') { wsRef.current?.send(JSON.stringify({type: 'RENAME_DEVICE', name: customName})); setEditingName(false); }
                        }} style={{ padding: '2px 4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
                        <button onClick={() => { wsRef.current?.send(JSON.stringify({type: 'RENAME_DEVICE', name: customName})); setEditingName(false); }}>Save</button>
                      </span>
                    )}
                  </div>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {participants.map(p => (
                      <li key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {p.name} {p.id === myId ? '(You)' : ''} {p.isHost ? '👑' : ''}
                        {amIHost && p.id !== myId && (
                           <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px', fontSize: '0.75rem' }}>
                             <input type="checkbox" checked={p.visible} onChange={(e) => {
                               wsRef.current?.send(JSON.stringify({type: 'TOGGLE_VISIBILITY', targetId: p.id, visible: e.target.checked}));
                             }} /> Show in Presentation
                           </label>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
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
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className={styles.btnSecondary} onClick={exportTxt}>Export TXT</button>
              <button className={styles.btnSecondary} onClick={exportDocx}>Export DOCX</button>
              <button className={styles.btnPrimary} onClick={exportPdf}>Export PDF</button>
              <button onClick={saveMeeting} className={styles.btnPrimary} disabled={isSaving} style={{ background: 'var(--brand-primary)', border: 'none', color: '#000', marginLeft: '8px' }}>
                {isSaving ? 'Saving...' : 'Save Meeting'}
              </button>
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
                    {(seg.speakerName || seg.speakerId).charAt(0)}
                  </div>
                  <div className={styles.segmentContent}>
                    <div className={styles.segmentHeader}>
                      <span className={styles.speakerName}>{seg.speakerName || seg.speakerId}</span>
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
