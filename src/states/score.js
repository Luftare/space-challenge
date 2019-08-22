import Phaser from 'phaser';
import { characters } from './boot';
import { formatTime } from '../utils';

let socket;
let playerScores;

export default class ScoreScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'score',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 300 },
          debug: false,
        },
      },
    });
  }

  init(data) {
    socket = window.globalContext.socket;
    socket.removeAllListeners();
    playerScores = data.playerScores;
    this.topScores = data.topScores;

    socket.on('START_GAME', ({ levelIndex }) => {
      this.scene.start('game', { levelIndex });
    });
  }

  create() {
    const { width, height } = this.game.scale;

    this.add
      .text(width * 0.5, 50, 'Leaderboard', {
        fontSize: 40,
      })
      .setOrigin(0.5, 0.5);

    this.topScores.forEach((topScore, i) => {
      const isNewRecord = playerScores.some(
        p => p.name === topScore.name && p.time === topScore.time
      );

      const scoreRow = this.add
        .text(
          width * 0.5,
          100 + i * 24,
          `${topScore.name}: ${formatTime(topScore.time)}`,
          {
            fontSize: 24,
            color: isNewRecord ? 'yellow' : 'white',
          }
        )
        .setOrigin(0.5, 0.5);

      if (isNewRecord) {
        this.add.tween({
          targets: scoreRow,
          scale: 1.2,
          yoyo: true,
          duration: 500,
          repeat: -1,
        });
      }
    });

    const topScore = this.topScores[0];

    playerScores
      .sort((a, b) => b.totalScore - a.totalScore)
      .forEach((player, position) => {
        const x = width * 0.1;
        const y = 250 + position * 50;

        this.add
          .text(x + 30, y, `${player.name}: ${player.totalScore}p`, {
            fontSize: 24,
          })
          .setOrigin(0, 0.5);

        if (player.lastScore > 0) {
          const x = width - 40;
          this.add
            .text(x, y, `+${player.lastScore}p`, {
              fontSize: 24,
              color: 'yellow',
            })
            .setOrigin(1, 0.5);
        }

        const shouldDisplayDelta = topScore && player.finished;

        if (shouldDisplayDelta) {
          const x = width - 140;
          this.add
            .text(x, y, `+${formatTime(player.time - topScore.time)}`, {
              fontSize: 24,
              color: 'red',
            })
            .setOrigin(1, 0.5);
        }

        const characterName = characters[player.characterIndex].name;

        this.add
          .sprite(x, y, characterName, 0)
          .setOrigin(0.5, 0.5)
          .setScale(0.8);
      });
  }

  update() {}
}
