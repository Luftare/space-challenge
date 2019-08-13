import Opponent from './Opponent';

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

    socket.on('STATE_UPDATE', playerModels => {
      playerModels
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
        const opponentIncludedInRemoteState = playerModels.some(
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

    socket.on('COUNTDOWN', count => {
      const text = count === 0 ? 'Go!' : count;
      this.game.flashMessage(text);
    });

    socket.on('OPPONENT_HIT_BLACK_HOLE', ({ id, x, y }) => {
      const opponent = this.opponents.find(o => o.id === id);
      if (!opponent) return;
      opponent.shrinkTo(x, y);
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
