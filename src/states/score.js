import Phaser from 'phaser';
import { characters } from './boot';
import { formatTime } from '../utils';

let socket;
let playerScores;

export default class GameScene extends Phaser.Scene {
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

    console.log(playerScores, this.topScores);
    socket.on('START_GAME', ({ levelIndex }) => {
      this.scene.start('game', { levelIndex });
    });
  }

  create() {
    const { width, height } = this.game.scale;
    const recordScore = this.topScores[0];

    this.add
      .text(width * 0.5, 50, 'Leaderboard', {
        fontSize: 40,
      })
      .setOrigin(0.5, 0.5);

    this.topScores.forEach((topScore, i) => {
      const isNewRecord = playerScores.some(
        p => p.name === topScore.name && p.totalTime === topScore.time
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

    playerScores
      .sort((a, b) => b.totalScore - a.totalScore)
      .forEach((player, position) => {
        const x = width * 0.1;
        const y = 250 + position * 50;
        this.add
          .text(x + 50, y, `${player.name}: ${player.totalScore}`, {
            fontSize: 30,
          })
          .setOrigin(0, 0.5);

        if (player.lastScore > 0) {
          const x = width - 50;
          this.add
            .text(x, y, `+${player.lastScore}`, {
              fontSize: 30,
              color: 'yellow',
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
