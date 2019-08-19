let players = [];

const COUNTDOWN_START = 6;
const LEVEL_COUNT = 27;
let countDownInterval = false;
let gameOverTimeout = false;
let countDown = COUNTDOWN_START;
let levelIndex = 0;
let lastLevelIndex = levelIndex;
let levelsBuffer = [levelIndex];
const LEVELS_BUFFER_LENGTH = Math.floor(LEVEL_COUNT * 0.7);
let io;
let db;

const sleep = time => new Promise(res => setTimeout(res, time));

const initGame = (_io, _db) => {
  io = _io;
  db = _db;

  setInterval(() => {
    io.sockets.emit('STATE_UPDATE', { players, levelIndex });
  }, 30);

  io.sockets.on('connection', socket => {
    socket.emit('PLAYER_COUNT', players.length);

    socket.on('disconnect', () => {
      players = players.filter(player => player.id !== socket.id);
      console.log('DISCONNECT:', socket.id);
      io.sockets.emit('PLAYER_COUNT', players.length);
    });

    socket.on('PLAYER_UPDATE', state => {
      players = players.map(p => (p.id === socket.id ? { ...p, ...state } : p));
    });

    socket.on('TAUNT', taunt => {
      socket.broadcast.emit('OPPONENT_TAUNT', { taunt, id: socket.id });
    });

    socket.on('LOGIN', ({ name, characterIndex, score }) => {
      console.log('LOGIN: ', socket.id);
      const playerExists = players.some(p => p.id === socket.id);
      if (!playerExists) {
        const player = generatePlayer(socket.id, name, characterIndex, score);
        players.push(player);
        socket.emit('START_GAME', { levelIndex });
        io.sockets.emit('PLAYER_COUNT', players.length);
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

  const finishedPLayers = players
    .filter(player => player.finished)
    .sort((a, b) => a.totalTime - b.totalTime)
    .map((player, position) => {
      const receivedScore = Math.max(0, 100 - position * 25);
      player.lastScore = receivedScore;
      player.totalScore += receivedScore;
      return player;
    });

  db.getTopScoreLimit(levelIndex).then(maxTime => {
    const topScorePlayers = finishedPLayers.filter(p => p.totalScore < maxTime);
    const topScorePlayersModels = topScorePlayers.map(p => ({
      name: p.name,
      time: p.totalTime,
      levelIndex,
    }));

    db.addTopScores(topScorePlayersModels)
      .then(() => db.getLevelTops(levelIndex))
      .then(topScores => {
        io.sockets.emit('GAME_OVER', { players, topScores });

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

          io.sockets.emit('START_GAME', { levelIndex });
        }, 812000);
      });
  });
}

function generateNewLevelIndex() {
  let newLevelIndex = levelIndex;

  while (levelsBuffer.includes(newLevelIndex)) {
    newLevelIndex = Math.floor(Math.random() * LEVEL_COUNT);
  }

  levelsBuffer.push(newLevelIndex);

  if (levelsBuffer.length > LEVELS_BUFFER_LENGTH) {
    levelsBuffer.shift();
  }
  return newLevelIndex;
}

module.exports = { initGame };
