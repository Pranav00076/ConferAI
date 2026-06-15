import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import WebSocketClient from 'ws'; // Node ws client

dotenv.config();

const app = express();
app.use(cors());

const port = process.env.PORT || 8081;
const keyPath = path.join(__dirname, '../key.pem');
const certPath = path.join(__dirname, '../cert.pem');
const isHttps = fs.existsSync(keyPath) && fs.existsSync(certPath);

const server = isHttps 
  ? https.createServer({ key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) }, app)
  : http.createServer(app);

// Initialize WebSocket server instance
const wss = new WebSocketServer({ server });

function broadcastParticipants(meetingId: string) {
  const meetingClients = activeMeetings.get(meetingId);
  if (!meetingClients) return;

  const participants: any[] = [];
  meetingClients.forEach(client => {
    const state = clientStates.get(client);
    if (state) {
      participants.push({
        id: state.id,
        name: state.name,
        isHost: state.isHost,
        visible: state.visible
      });
    }
  });

  meetingClients.forEach(client => {
    if (client.readyState === WebSocketClient.OPEN) {
      client.send(JSON.stringify({
        type: 'PARTICIPANTS_UPDATE',
        data: participants
      }));
    }
  });
}

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
interface ClientState {
  id: string;
  meetingId: string;
  name: string;
  isHost: boolean;
  visible: boolean;
  dgConnection: WebSocketClient | null;
}

const activeMeetings = new Map<string, Set<WebSocketClient>>();
const clientStates = new Map<WebSocketClient, ClientState>();

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

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  console.log('New client connected');
  let currentMeetingId: string | null = null;
  
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim() 
    : (Array.isArray(forwarded) ? forwarded[0].trim() : req.socket.remoteAddress || 'unknown');
  
  const localMeetingId = `wifi-${clientIp.replace(/[^a-zA-Z0-9]/g, '')}`;

  ws.on('message', (message: Buffer, isBinary: boolean) => {
    if (isBinary) {
      const state = clientStates.get(ws);
      if (state && state.dgConnection && state.dgConnection.readyState === WebSocketClient.OPEN) {
        state.dgConnection.send(message);
      }
      return;
    }

    try {
      const data = JSON.parse(message.toString());
      
      if (data.type === 'JOIN_MEETING') {
        currentMeetingId = data.meetingId === 'local' ? localMeetingId : data.meetingId;
        console.log(`Client joined meeting: ${currentMeetingId} (Requested: ${data.meetingId})`);
        
        if (currentMeetingId && !activeMeetings.has(currentMeetingId)) {
          activeMeetings.set(currentMeetingId, new Set());
        }
        
        if (currentMeetingId) {
          activeMeetings.get(currentMeetingId)!.add(ws);
          const name = data.displayName || `Guest ${Math.floor(Math.random() * 1000)}`;
          clientStates.set(ws, { 
            id: data.clientId || Math.random().toString(36).substring(7),
            meetingId: currentMeetingId, 
            name, 
            isHost: false,
            visible: true,
            dgConnection: null 
          });
          broadcastParticipants(currentMeetingId);
        }
      }

      if (data.type === 'RENAME_DEVICE') {
        const state = clientStates.get(ws);
        if (state && currentMeetingId) {
          state.name = data.name;
          broadcastParticipants(currentMeetingId);
        }
      }

      if (data.type === 'CLAIM_HOST') {
        const state = clientStates.get(ws);
        if (state && currentMeetingId) {
          // Un-host everyone else
          const clients = activeMeetings.get(currentMeetingId);
          if (clients) {
            clients.forEach(c => {
              const cState = clientStates.get(c);
              if (cState) cState.isHost = false;
            });
          }
          state.isHost = true;
          broadcastParticipants(currentMeetingId);
        }
      }

      if (data.type === 'TOGGLE_VISIBILITY') {
        const state = clientStates.get(ws);
        if (state?.isHost && currentMeetingId) {
          const clients = activeMeetings.get(currentMeetingId);
          if (clients) {
            clients.forEach(c => {
              const cState = clientStates.get(c);
              if (cState && cState.id === data.targetId) {
                cState.visible = data.visible;
              }
            });
            broadcastParticipants(currentMeetingId);
          }
        }
      }

      if (data.type === 'START_TRANSCRIPTION' && currentMeetingId) {
        console.log(`Started transcription for client in: ${currentMeetingId}`);
        const state = clientStates.get(ws);
        
        if (!process.env.DEEPGRAM_API_KEY || process.env.DEEPGRAM_API_KEY === 'your_deepgram_api_key_here') {
           console.error("Deepgram API key missing in .env!");
           return;
        }

        if (state && !state.dgConnection) {
          const dgLive = new WebSocketClient('wss://api.deepgram.com/v1/listen?model=nova-2&language=hi&smart_format=true&diarize=true&endpointing=500', {
            headers: { Authorization: `Token ${process.env.DEEPGRAM_API_KEY}` }
          });

          state.dgConnection = dgLive;

          dgLive.on('open', () => {
            console.log(`Deepgram connection opened for a client in ${currentMeetingId}`);
          });

          dgLive.on('message', (message: string) => {
            const data = JSON.parse(message);
            
            if (data.type === 'Results') {
              const transcript = data.channel.alternatives[0].transcript;
              const isFinal = data.is_final;
              
              let speakerId = "Speaker";
              if (data.channel.alternatives[0].words && data.channel.alternatives[0].words.length > 0) {
                  const spk = data.channel.alternatives[0].words[0].speaker;
                  if (spk !== undefined) speakerId = `Speaker ${spk + 1}`;
              }

              if (transcript && isFinal) {
                const currentClientState = clientStates.get(ws);
                const segment = {
                  id: Math.random().toString(36).substring(7),
                  speakerId: currentClientState ? currentClientState.id : speakerId,
                  speakerName: currentClientState ? currentClientState.name : speakerId,
                  text: transcript,
                  timestamp: new Date().toISOString(),
                  isVisible: currentClientState ? currentClientState.visible : true
                };
                
                // Broadcast to all clients in the meeting
                const meetingClients = activeMeetings.get(currentMeetingId!);
                if (meetingClients) {
                  meetingClients.forEach(client => {
                    if (client.readyState === WebSocketClient.OPEN) {
                      client.send(JSON.stringify({
                        type: 'TRANSCRIPT_SEGMENT',
                        data: segment
                      }));
                    }
                  });
                }
              }
            }
          });

          dgLive.on('error', (err: any) => {
            console.error("Deepgram error:", err);
          });
          
          dgLive.on('close', () => {
            console.log(`Deepgram connection closed for a client in ${currentMeetingId}`);
          });
        }
      }

      if (data.type === 'STOP_TRANSCRIPTION' && currentMeetingId) {
         console.log(`Stopped transcription for client in: ${currentMeetingId}`);
         const state = clientStates.get(ws);
         if (state && state.dgConnection) {
           state.dgConnection.send(JSON.stringify({ type: 'CloseStream' }));
           state.dgConnection = null;
         }
      }

    } catch (e) {
      console.error('Invalid message format', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if (currentMeetingId) {
      const state = clientStates.get(ws);
      if (state && state.dgConnection) {
        state.dgConnection.close();
      }
      clientStates.delete(ws);

      const meetingClients = activeMeetings.get(currentMeetingId);
      if (meetingClients) {
        meetingClients.delete(ws);
        
        // Cleanup if meeting is empty, otherwise update others
        if (meetingClients.size === 0) {
          activeMeetings.delete(currentMeetingId);
          console.log(`Cleaned up meeting: ${currentMeetingId}`);
        } else {
          broadcastParticipants(currentMeetingId);
        }
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
