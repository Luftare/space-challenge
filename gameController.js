const Room = require('./Room');
let rooms = [];

let io;
let db;
let gameRunning = false;

const sleep = time => new Promise(res => setTimeout(res, time));

function getTotalPlayersCount() {
  return rooms.reduce((sum, room) => sum + room.players.length, 0);
}

const initGame = async (_io, _db) => {
  if (gameRunning) return;
  gameRunning = true;

  io = _io;
  db = _db;

  const roomModels = await db.getRooms();
  const publicRoomModels = roomModels.filter(room => room.published);

  rooms = publicRoomModels.map(model => {
    if (model.published) {
      return new Room({
        io,
        db,
        name: model.name,
        levels: model.levels,
      });
    }
  });

  setInterval(() => {
    rooms.forEach(room => {
      room.updateClients();
    });
  }, 100);

  io.sockets.on('connection', socket => {
    let room;

    socket.emit('PLAYER_COUNT', getTotalPlayersCount());

    socket.on('disconnect', () => {
      if (room) {
        room.removePlayer(socket.id);
        io.sockets.emit('PLAYER_COUNT', getTotalPlayersCount());
      }
    });

    socket.on('PLAYER_UPDATE', state => {
      if (!room) return;
      room.updatePlayer(socket.id, state);
    });

    socket.on('TAUNT', taunt => {
      if (!room) return;
      room.taunt(socket, taunt);
    });

    socket.on('LOGIN', ({ name, roomName, characterIndex, score }) => {
      room = rooms.find(room => room.name === roomName);
      if (!room) return;

      room.addPlayer({ socket, id: socket.id, name, characterIndex, score });
      io.sockets.emit('PLAYER_COUNT', getTotalPlayersCount());
    });

    socket.on('GET_ROOMS', async callback => {
      const rooms = await db.getRooms();
      const publishedRooms = rooms.filter(room => room.published);
      callback(publishedRooms);
    });

    socket.on('PLAYER_REACH_GOAL', ({ time }) => {
      if (!room) return;
      room.handlePlayerReachGoal(socket.id, time);
    });

    socket.on('PLAYER_HIT_BLACK_HOLE', ({ x, y }) => {
      socket.broadcast.emit('OPPONENT_HIT_BLACK_HOLE', { x, y, id: socket.id });
    });
  });
};

module.exports = { initGame };
