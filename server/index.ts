import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

const port = process.env.PORT || 8080;
const server = http.createServer(app);

// Initialize WebSocket server instance
const wss = new WebSocketServer({ server });

// Mock speaker labels and phrases for tech conference
const SPEAKERS = ['Alice (PM)', 'Bob (Eng)', 'Charlie (Design)'];
const MOCK_PHRASES = [
  "So the main goal for this quarter is...",
  "If we look at the latency metrics, we're seeing a 20% improvement.",
  "I think the new dark mode aesthetic looks incredible.",
  "Wait, are we still using WebSockets or did we switch to WebRTC?",
  "Let's make sure we add an action item to update the docs.",
  "Yes, the CSS modules approach gives us much better scoping.",
  "Can someone share their screen for the presentation?",
  "The Prisma migration failed on staging, I'm looking into it.",
  "We should export these transcripts to PDF for the stakeholders."
];

// Meeting state
interface MeetingSession {
  id: string;
  clients: Set<WebSocket>;
  intervalId?: NodeJS.Timeout | undefined;
}

const activeMeetings = new Map<string, MeetingSession>();

function generateMockSegment() {
  const speaker = SPEAKERS[Math.floor(Math.random() * SPEAKERS.length)];
  const phrase = MOCK_PHRASES[Math.floor(Math.random() * MOCK_PHRASES.length)];
  return {
    id: Math.random().toString(36).substring(7),
    speaker,
    text: phrase,
    timestamp: new Date().toISOString()
  };
}

wss.on('connection', (ws: WebSocket) => {
  console.log('New client connected');
  let currentMeetingId: string | null = null;

  ws.on('message', (message: Buffer, isBinary: boolean) => {
    if (isBinary) {
      if (currentMeetingId) {
        console.log(`[Meeting ${currentMeetingId}] Received audio chunk (${message.length} bytes). Forward to Whisper/Deepgram API...`);
      }
      return;
    }

    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'JOIN_MEETING') {
        currentMeetingId = data.meetingId;
        console.log(`Client joined meeting: ${currentMeetingId}`);
        
        if (currentMeetingId && !activeMeetings.has(currentMeetingId)) {
          activeMeetings.set(currentMeetingId, {
            id: currentMeetingId,
            clients: new Set(),
          });
        }
        
        if (currentMeetingId) {
          const session = activeMeetings.get(currentMeetingId)!;
          session.clients.add(ws);
        }
      }

      if (data.type === 'START_TRANSCRIPTION' && currentMeetingId) {
        console.log(`Started transcription for: ${currentMeetingId}`);
        const session = activeMeetings.get(currentMeetingId)!;
        
        // Start emitting mock transcripts every 3-6 seconds
        if (!session.intervalId) {
          session.intervalId = setInterval(() => {
            const segment = generateMockSegment();
            
            // Broadcast to all clients in this meeting
            session.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'TRANSCRIPT_SEGMENT',
                  data: segment
                }));
              }
            });
          }, 4000);
        }
      }

      if (data.type === 'STOP_TRANSCRIPTION' && currentMeetingId) {
         console.log(`Stopped transcription for: ${currentMeetingId}`);
         const session = activeMeetings.get(currentMeetingId);
         if (session && session.intervalId) {
           clearInterval(session.intervalId);
           session.intervalId = undefined;
         }
      }

    } catch (e) {
      console.error('Invalid message format', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (currentMeetingId && activeMeetings.has(currentMeetingId)) {
      const session = activeMeetings.get(currentMeetingId)!;
      session.clients.delete(ws);
      
      // Cleanup if meeting is empty
      if (session.clients.size === 0) {
        if (session.intervalId) clearInterval(session.intervalId);
        activeMeetings.delete(currentMeetingId);
        console.log(`Cleaned up meeting: ${currentMeetingId}`);
      }
    }
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

server.listen(port, () => {
  console.log(`Server started on port ${port} :)`);
});
