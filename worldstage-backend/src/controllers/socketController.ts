import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: number;
  username?: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Middleware to authenticate socket connections
  io.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('Socket connection rejected: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      socket.userId = decoded.id;
      socket.username = decoded.username;
      console.log(`Socket authenticated for user: ${decoded.username} (ID: ${decoded.id})`);
      next();
    } catch (error) {
      console.log('Socket connection rejected: Invalid token');
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 User ${socket.username} connected (Socket ID: ${socket.id})`);

    // Join user to their personal room for notifications
    if (socket.userId) {
      socket.join(`user_${socket.userId}`);
    }

    // Handle game joining
    socket.on('join_game', (gameId: number) => {
      const roomName = `game_${gameId}`;
      socket.join(roomName);
      console.log(`👤 ${socket.username} joined game ${gameId}`);
      
      // Notify other players in the game
      socket.to(roomName).emit('player_joined', {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      });

      // Send confirmation to the user
      socket.emit('game_joined', {
        gameId,
        message: `Successfully joined game ${gameId}`,
        timestamp: new Date().toISOString()
      });
    });

    // Handle leaving a game
    socket.on('leave_game', (gameId: number) => {
      const roomName = `game_${gameId}`;
      socket.leave(roomName);
      console.log(`👤 ${socket.username} left game ${gameId}`);
      
      // Notify other players
      socket.to(roomName).emit('player_left', {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      });
    });

    // Handle in-game actions
    socket.on('game_action', (data: { gameId: number; action: string; payload: any }) => {
      const { gameId, action, payload } = data;
      const roomName = `game_${gameId}`;
      
      console.log(`🎮 ${socket.username} performed action "${action}" in game ${gameId}`);
      
      // Broadcast action to all players in the game (including sender)
      io.to(roomName).emit('game_update', {
        userId: socket.userId,
        username: socket.username,
        action,
        payload,
        timestamp: new Date().toISOString()
      });
    });

    // Handle diplomatic messages
    socket.on('send_message', (data: { gameId: number; toUserId: number; message: string; subject?: string }) => {
      const { gameId, toUserId, message, subject } = data;
      
      console.log(`💬 ${socket.username} sent message to user ${toUserId} in game ${gameId}`);
      
      // Send to specific user
      io.to(`user_${toUserId}`).emit('new_message', {
        fromUserId: socket.userId,
        fromUsername: socket.username,
        gameId,
        subject,
        message,
        timestamp: new Date().toISOString()
      });

      // Confirm to sender
      socket.emit('message_sent', {
        toUserId,
        subject,
        message,
        timestamp: new Date().toISOString()
      });
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { gameId: number; toUserId?: number }) => {
      const { gameId, toUserId } = data;
      
      if (toUserId) {
        // Private message typing
        io.to(`user_${toUserId}`).emit('user_typing', {
          fromUserId: socket.userId,
          fromUsername: socket.username,
          gameId
        });
      } else {
        // Game chat typing
        socket.to(`game_${gameId}`).emit('user_typing', {
          fromUserId: socket.userId,
          fromUsername: socket.username,
          gameId
        });
      }
    });

    socket.on('typing_stop', (data: { gameId: number; toUserId?: number }) => {
      const { gameId, toUserId } = data;
      
      if (toUserId) {
        io.to(`user_${toUserId}`).emit('user_stopped_typing', {
          fromUserId: socket.userId,
          fromUsername: socket.username,
          gameId
        });
      } else {
        socket.to(`game_${gameId}`).emit('user_stopped_typing', {
          fromUserId: socket.userId,
          fromUsername: socket.username,
          gameId
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User ${socket.username} disconnected: ${reason}`);
      
      // Note: Socket.io automatically removes the socket from all rooms upon disconnect
      // We could notify games here if we wanted to show real-time online/offline status
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.username}:`, error);
    });
  });

  console.log('✅ Socket.io handlers configured');
};

// Helper function to send notifications to specific users
export const sendNotificationToUser = (io: Server, userId: number, notification: any) => {
  io.to(`user_${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date().toISOString()
  });
};

// Helper function to broadcast to a game
export const broadcastToGame = (io: Server, gameId: number, event: string, data: any) => {
  io.to(`game_${gameId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });
}; 