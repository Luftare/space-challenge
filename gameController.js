let players = [];

const COUNTDOWN_START = 6;
const LEVEL_COUNT = 6;
let countDownInterval = false;
let countDown = COUNTDOWN_START;
let levelIndex = Math.floor(Math.random() * LEVEL_COUNT);

const initGame = io => {
  setInterval(() => {
    io.sockets.emit('STATE_UPDATE', players);
  }, 30);

  io.sockets.on('connection', socket => {
    let player = {};

    socket.on('disconnect', () => {
      players = players.filter(player => player.id !== socket.id);
    });

    socket.on('PLAYER_UPDATE', state => {
      players = players.map(p => (p.id === socket.id ? { ...p, ...state } : p));
    });

    socket.on('LOGIN', data => {
      const player = {
        id: socket.id,
        character: 'human',
        finished: false,
        totalTime: 0,
        totalScore: 0,
        name: '',
        d: 1,
        r: false,
        f: false,
        x: 0,
        y: 0,
        ...data,
      };

      players.push(player);
      socket.emit('JOIN_GAME', { levelIndex });
    });

    socket.on('PLAYER_REACH_GOAL', ({ totalTime }) => {
      const player = players.find(p => p.id === socket.id);
      if (!player) return;
      player.totalTime = totalTime;
      player.finished = true;

      io.sockets.emit('PLAYER_REACH_GOAL', player);

      const countDownActive = countDownInterval !== false;

      if (countDownActive) {
        return;
      }

      countDownInterval = setInterval(() => {
        countDown--;

        io.sockets.emit('COUNTDOWN', countDown);

        if (countDown <= 0) {
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
            countDown = COUNTDOWN_START;
            players.forEach(player => {
              player.totalTime = 0;
              player.finished = false;
            });
            levelIndex = Math.floor(Math.random() * LEVEL_COUNT);
            io.sockets.emit('PREPARE_LEVEL', { levelIndex });
          }, 8000);
        }
      }, 1000);
    });

    socket.emit('NEW_GAME', { levelIndex });
  });
};

module.exports = { initGame };
