const COUNTDOWN_START = 6;

class Room {
  constructor({ io, db, name, levels }) {
    this.db = db;
    this.io = io;
    this.name = name;
    this.levels = levels;
    this.levelIndex = levels[0];
    this.players = [];
    this.levelsBuffer = [this.levelIndex];
    this.countDownInterval = null;
    this.countDown = COUNTDOWN_START;
    this.gameOverTimeout = null;
    this.levelsBufferLength = Math.floor(levels.length * 0.7);
  }

  addPlayer({ socket, id, name, characterIndex, score = 0 }) {
    this.players.push({
      finished: false,
      time: 0,
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
    });

    socket.join(this.name);
    socket.emit('START_GAME', { levelIndex: this.levelIndex });
  }

  updatePlayer(id, state) {
    this.players = this.players.map(p =>
      p.id === id ? { ...p, ...state } : p
    );
  }

  removePlayer(id) {
    this.players = this.players.filter(player => player.id !== id);
  }

  updateClients() {
    this.io.sockets.in(this.name).emit('STATE_UPDATE', {
      players: this.players,
      levelIndex: this.levelIndex,
    });
  }

  taunt(socket, taunt) {
    socket.broadcast.emit('OPPONENT_TAUNT', { taunt, id: socket.id });
  }

  handlePlayerReachGoal(id, time) {
    const player = this.players.find(p => p.id === id);
    if (!player) return;
    player.time = time;
    player.finished = true;

    this.io.sockets.in(this.name).emit('PLAYER_REACH_GOAL', player);

    const countDownActive = this.countDownInterval !== null;

    if (countDownActive) {
      return;
    }

    this.countDownInterval = setInterval(() => {
      this.countDown--;

      this.io.sockets.in(this.name).emit('COUNTDOWN', this.countDown);

      if (this.countDown <= 0) {
        this.handleGameOver();
      }
    }, 1000);
  }

  handleGameOver() {
    clearInterval(this.countDownInterval || 0);

    const finishedPLayers = this.players
      .filter(player => player.finished)
      .sort((a, b) => a.time - b.time)
      .map((player, position) => {
        const receivedScore = Math.max(0, 100 - position * 25);
        player.lastScore = receivedScore;
        player.totalScore += receivedScore;
        return player;
      });

    const playerScores = finishedPLayers.map(p => ({
      name: p.name,
      time: p.time,
      levelIndex: this.levelIndex,
    }));

    this.db
      .addScores(playerScores)
      .then(() => this.db.getLevelTops(this.levelIndex))
      .then(topScores => {
        this.io.sockets
          .in(this.name)
          .emit('GAME_OVER', { players: this.players, topScores });

        setTimeout(() => {
          this.countDownInterval = null;
          this.countDown = COUNTDOWN_START;

          this.players.forEach(player => {
            player.time = 0;
            player.finished = false;
            player.lastScore = 0;
          });

          this.generateNewLevelIndex();

          this.io.sockets
            .in(this.name)
            .emit('START_GAME', { levelIndex: this.levelIndex });
        }, 12000);
      })
      .catch(console.log);
  }

  generateNewLevelIndex() {
    if (this.levels.length === 1) {
      return this.levelIndex;
    }

    const availableIndexes = this.levels.filter(
      levelIndex => !this.levelsBuffer.includes(levelIndex)
    );
    const nextLevelIndexKey = Math.floor(
      Math.random() * availableIndexes.length
    );
    const nextLevelIndex = availableIndexes[nextLevelIndexKey];
    this.levelIndex = nextLevelIndex;

    this.levelsBuffer.push(nextLevelIndex);

    if (this.levelsBuffer.length > this.levelsBufferLength) {
      this.levelsBuffer.shift();
    }
  }
}

module.exports = Room;
