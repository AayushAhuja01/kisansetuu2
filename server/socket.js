// Experiment 8: real-time chat with Socket.IO.
// A socket is a live two-way connection. The browser stays connected, so the server can push
// new messages instantly instead of the page asking again and again.
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Conversation, Message } from './models.js';

const isMember = (c, id) => c && [String(c.farmer), String(c.buyer)].includes(String(id));

export async function saveMessage(userId, convId, text) {
  text = String(text || '').trim();
  if (!text || text.length > 1000) throw Object.assign(new Error('Message must be 1 to 1000 characters'), { safe: true });
  const c = await Conversation.findById(convId);
  if (!isMember(c, userId)) throw Object.assign(new Error('Not allowed'), { safe: true });
  const m = await Message.create({ conversation: c._id, sender: userId, text });
  await Conversation.updateOne({ _id: c._id }, { $currentDate: { updatedAt: true } });
  return m;
}

export function attachSocket(httpServer, origins) {
  const io = new Server(httpServer, { cors: { origin: origins } });

  // Authenticate every connection with the same JWT used by the REST API
  io.use((socket, next) => {
    try { socket.user = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET); next(); }
    catch { next(new Error('Unauthorized')); }
  });

  io.on('connection', socket => {
    socket.on('join', async (convId, ack = () => {}) => {
      try {
        const c = await Conversation.findById(convId);
        if (!isMember(c, socket.user.id)) return ack({ error: 'Not allowed' });
        socket.join(String(convId));              // a "room" holds only the two people in this chat
        ack({ ok: true });
      } catch { ack({ error: 'Invalid conversation' }); }
    });

    socket.on('message', async ({ conversationId, text } = {}, ack = () => {}) => {
      try {
        const m = await saveMessage(socket.user.id, conversationId, text);   // saved in MongoDB first
        io.to(String(conversationId)).emit('message', m);                    // then pushed to both people
        ack({ ok: true });
      } catch (e) { ack({ error: e.safe ? e.message : 'Could not send message' }); }
    });
  });
  return io;
}
