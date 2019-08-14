let players = [];

const COUNTDOWN_START = 6;
const LEVEL_COUNT = 23;
let countDownInterval = false;
let gameOverTimeout = false;
let countDown = COUNTDOWN_START;
let levelIndex = 0;
let lastLevelIndex = levelIndex;
let io;

const initGame = _io => {
  io = _io;
  setInterval(() => {
    io.sockets.emit('STATE_UPDATE', { players, levelIndex });
  }, 30);

  io.sockets.on('connection', socket => {
    socket.on('disconnect', () => {
      players = players.filter(player => player.id !== socket.id);

      console.log('DISCONNECT:', socket.id);
    });

    socket.on('PLAYER_UPDATE', state => {
      players = players.map(p => (p.id === socket.id ? { ...p, ...state } : p));
    });

    socket.on('LOGIN', ({ name, characterIndex, score }) => {
      console.log('LOGIN: ', socket.id);
      const playerExists = players.some(p => p.id === socket.id);
      if (!playerExists) {
        const player = generatePlayer(socket.id, name, characterIndex, score);
        players.push(player);
        socket.emit('JOIN_GAME', { levelIndex });
      }
    });

    socket.on('PLAYER_REACH_GOAL', ({ totalTime }) => {
      handlePlayerReachGoal(socket.id, totalTime);
    });

    socket.on('PLAYER_HIT_BLACK_HOLE', ({ x, y }) => {
      socket.broadcast.emit('OPPONENT_HIT_BLACK_HOLE', { x, y, id: socket.id });
    });
  });
};

function generatePlayer(id, name, characterIndex, score = 0) {
  return {
    finished: false,
    totalTime: 0,
    totalScore: score,
    lastScore: 0,
    d: 1,
    r: false,
    f: false,
    x: 0,
    y: 0,
    id,
    name,
    characterIndex,
  };
}

function handlePlayerReachGoal(id, totalTime) {
  const player = players.find(p => p.id === id);
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
      handleGameOver();
    }
  }, 1000);
}

function handleGameOver() {
  clearInterval(countDownInterval || 0);

  players
    .filter(player => player.finished)
    .sort((a, b) => a.totalTime - b.totalTime)
    .forEach((player, position) => {
      const receivedScore = Math.max(0, 100 - position * 35);
      player.lastScore = receivedScore;
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
      player.lastScore = 0;
    });
    levelIndex = generateNewLevelIndex();
    io.sockets.emit('PREPARE_LEVEL', { levelIndex });
  }, 8000);
}

function generateNewLevelIndex() {
  let newLevelIndex = levelIndex;

  while (newLevelIndex === levelIndex) {
    newLevelIndex = Math.floor(Math.random() * LEVEL_COUNT);
  }
  return newLevelIndex;
}

module.exports = { initGame };
