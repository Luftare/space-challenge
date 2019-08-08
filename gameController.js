let players = [];

const COUNTDOWN_START = 5;
let countDownInterval = false;
let countDown = COUNTDOWN_START;
let levelIndex = 0;

const initGame = io => {
  setInterval(() => {
    io.sockets.emit('STATE_UPDATE', players);
  }, 20);

  io.sockets.on('connection', socket => {
    console.log('CONNECT: ' + socket.id);

    const player = {
      id: socket.id,
      finished: false,
      totalTime: 0,
      totalScore: 0,
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
      players = players.map(p => (p.id === socket.id ? { ...p, ...state } : p));
    });

    socket.on('LOGIN', data => {
      players = players.map(p => (p.id === socket.id ? { ...p, ...data } : p));
      socket.emit('JOIN_GAME', { levelIndex });
    });

    socket.on('PLAYER_REACH_GOAL', ({ totalTime }) => {
      const player = players.find(p => p.id === socket.id);
      player.totalTime = totalTime;
      player.finished = true;

      io.sockets.emit('PLAYER_REACH_GOAL', player);

      const countDownActive = countDownInterval !== false;

      if (countDownActive) {
        return;
      }

      countDownInterval = setInterval(() => {
        countDown--;

        if (countDown > 0) {
          io.sockets.emit('COUNTDOWN', countDown--);
        } else {
          clearInterval(countDownInterval);

          players
            .filter(player => player.finished)
            .sort((a, b) => a.totalTime - b.totalTime)
            .forEach((player, position) => {
              const receivedScore = Math.max(0, 100 - position * 35);
              player.totalScore += receivedScore;
            });

          io.sockets.emit('GAME_OVER', players);
          setTimeout(() => {
            console.log('NEW GAME!');
            countDownInterval = false;
            players.forEach(player => {
              player.totalTime = 0;
              player.finished = false;
            });

            io.sockets.emit('PREPARE_LEVEL', { levelIndex });
          }, 5000);
        }
      }, 1000);
    });

    socket.emit('NEW_GAME', { levelIndex });
  });
};

module.exports = { initGame };
