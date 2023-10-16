const { Server } = require('socket.io');
const { stringify } = require('uuid');
const MessagesServices = require('./modules/messages/messagesServices');
const UsersServices = require('./modules/users/usersServices');
const { user } = require('./utils/database');
const { logger } = require('./utils/logger');

function createSocketServer(server) {
  const io = new Server(server, {
    cors: { origin: '*' },
  });
  
  io.on('connection', (socket) => {
    logger.info(`Nova conexão! ${socket.id}`);

    const userState = new Map();

    socket.on('join-room', async (data, callback) => {
      const { user, roomCode } = data;

      console.log(user.name);
      logger.info(`Usuário ${user.name} entrando em: ${roomCode}`);
      const userRoom = userState.get('room');
      if (userRoom) {
        if (userRoom.code === data.roomCode)
          return callback({ room: userRoom });

        socket.leave(userRoom.code);
      }

      try {
        const room = await UsersServices.findUserRoom(user.id, roomCode);

        if (!room) {
          logger.error('Sala não encontrada');
          return callback({ error: 404 });
        }
        //a partir daqui temos acesso à nossa sala e usuário
        socket.join(room.code);
        socket.to(room.code).emit('user-joined', data.user);
        userState.set('room', room).set('user', user);
        return callback({ room });
      } catch (error) {
        return callback({ error: error.message });
      }
    });

    socket.on('send-message', async (data, callback) => {
      const room = await UsersServices.findUserRoom(
        data.user.id,
        data.roomCode
      );

      const message = await MessagesServices.create(
        {
          content: data.message,
          roomId: room.id,
          userId: data.user.id,
        },
        true
      );

      logger.info(`Mensagem enviada para: ${room.name}: ${data.message}`);
      socket.to(room.code).emit('receive-message', message);

      return callback({ message });
    });

    socket.on('leave-room', (data) => {
      socket.leave(data.roomCode);
      socket.to(data.roomCode).emit('user-left', data.user);
    });

    socket.on('disconnect', () => {
      logger.info('Usuário desconectou', { id: socket.id });
    });
  });
}

module.exports = createSocketServer;
