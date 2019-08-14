import Opponent from './Opponent';
import { characters } from '../boot';

const EMIT_UPDATE_DT = 20;

export default class ClientConnection {
  constructor(game, socket) {
    this.game = game;
    this.socket = socket;
    this.lastUpdateTime = Date.now();
    this.opponents = [];
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    const socket = this.socket;

    socket.removeAllListeners();

    socket.on('STATE_UPDATE', ({ players, levelIndex }) => {
      if (levelIndex !== this.game.levelIndex) {
        this.game.scene.start('game', { levelIndex });
        return;
      }

      const remoteSelf = players.find(p => p.id === socket.id);

      if (remoteSelf) {
        window.globalContext.score = Math.max(
          window.globalContext.score,
          remoteSelf.totalScore
        );
      }

      players
        .filter(model => model.id !== socket.id)
        .forEach(opponentModel => {
          const localOpponent = this.opponents.find(
            p => p.id === opponentModel.id
          );

          if (localOpponent) {
            localOpponent.applyRemoteState(opponentModel);
          } else {
            this.opponents.push(new Opponent(this.game, opponentModel));
          }
        });

      this.opponents = this.opponents.filter(opponent => {
        const opponentIncludedInRemoteState = players.some(
          m => m.id === opponent.id
        );

        if (opponentIncludedInRemoteState) {
          return true;
        } else {
          opponent.destroy();
          return false;
        }
      });
    });

    socket.on('reconnect', () => {
      socket.emit('LOGIN', {
        name: window.globalContext.name,
        characterIndex: characters.indexOf(window.globalContext.character),
        score: window.globalContext.score,
      });
    });

    socket.on('COUNTDOWN', count => {
      const text = count === 0 ? 'Go!' : count;
      this.game.flashMessage(text);
    });

    socket.on('OPPONENT_HIT_BLACK_HOLE', ({ id, x, y }) => {
      const opponent = this.opponents.find(o => o.id === id);
      if (!opponent) return;
      opponent.shrinkTo(x, y);
      opponent.spinOnce();
    });

    socket.on('PLAYER_REACH_GOAL', finishedPlayer => {
      const isSelf = finishedPlayer.id === socket.id;
      const target = isSelf
        ? this.game.player
        : this.opponents.find(p => p.id === finishedPlayer.id);

      target.shrinkTo(
        this.game.rocket.sprite.body.center.x,
        target.sprite.y,
        () => {
          this.game.rocket.receivePlayer();
        }
      );
    });

    socket.on('JOIN_GAME', ({ levelIndex }) => {
      this.game.scene.start('game', { levelIndex });
    });

    socket.on('PREPARE_LEVEL', ({ levelIndex }) => {
      this.game.scene.start('game', { levelIndex });
    });

    socket.on('GAME_OVER', playerScores => {
      this.game.rocket.depart(() => {
        this.game.scene.start('score', { playerScores });
      });
    });
  }

  handlePlayerReachGoal(totalTime) {
    this.socket.emit('PLAYER_REACH_GOAL', { totalTime });
  }

  handlePlayerHitBlackHole(x, y) {
    this.socket.emit('PLAYER_HIT_BLACK_HOLE', { x, y });
  }

  emitUpdate(extraProperties = {}) {
    const now = Date.now();
    const sinceLastUpdate = now - this.lastUpdateTime;
    const shouldUpdate = sinceLastUpdate >= EMIT_UPDATE_DT;

    if (shouldUpdate) {
      const model = this.game.player.getCompressedModel();

      this.socket.emit('PLAYER_UPDATE', {
        ...model,
        ...extraProperties,
      });

      this.lastUpdateTime = now;
    }
  }
}
