import Phaser from 'phaser';

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

  create() {
    const { width, height } = this.game.scale;

    this.add
      .text(width * 0.5, 50, 'Score', {
        fontSize: 40,
      })
      .setOrigin(0.5, 0.5);

    setTimeout(() => {
      this.scene.start('game');
    }, 3000);
  }

  update() {}
}
