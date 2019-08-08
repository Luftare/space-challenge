import Phaser from 'phaser';

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

    socket.on('PREPARE_LEVEL', ({ levelIndex }) => {
      this.scene.start('game', { levelIndex: 0 });
    });
  }

  create() {
    const { width, height } = this.game.scale;

    this.add
      .text(width * 0.5, 50, 'Score', {
        fontSize: 40,
      })
      .setOrigin(0.5, 0.5);

    playerScores
      .sort((a, b) => b.totalScore - a.totalScore)
      .forEach((player, position) => {
        const x = width * 0.1;
        const y = 120 + position * 45;
        this.add
          .text(
            x + 50,
            y,
            `${position + 1}: ${player.name}, ${player.totalScore}`,
            {
              fontSize: 30,
            }
          )
          .setOrigin(0, 0.5);

        this.add
          .sprite(x, y, player.character, 0)
          .setOrigin(0.5, 0.5)
          .setScale(0.8);
      });
  }

  update() {}
}
