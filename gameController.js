let players = [];
const sockets = {};

const initGame = io => {
  setInterval(() => {
    io.sockets.emit('STATE_UPDATE', players);
  }, 20);

  io.sockets.on('connection', socket => {
    sockets[socket.id] = socket;
    console.log('CONNECT: ' + socket.id);

    const player = {
      id: socket.id,
      name: '',
      x: 0,
      y: 0,
    };

    players.push(player);

    socket.on('disconnect', () => {
      players = players.filter(player => player.id !== socket.id);
      io.sockets.emit('PLAYER_DISCONNECTED', player);
      console.log('DISCONN: ' + socket.id);
    });

    socket.on('PLAYER_UPDATE', state => {
      const updatedPlayer = {
        ...player,
        ...state,
      };

      players = players.map(p => (p.id === socket.id ? updatedPlayer : p));
    });

    io.sockets.emit('PLAYER_CONNECTED', player);
  });
};

module.exports = { initGame };
