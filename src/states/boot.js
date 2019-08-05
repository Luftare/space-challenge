export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'boot' });
  }

  preload() {
    this.load.spritesheet('player', require('../assets/player.png'), {
      frameWidth: 40,
      frameHeight: 55,
    });
    this.load.image('ground', require('../assets/ground.jpg'));

    const { width, height } = this.game.scale;
    const rect = new Phaser.Geom.Rectangle(
      width * 0.2,
      height * 0.45,
      width * 0.6,
      height * 0.1
    );

    const gfx = this.add.graphics();
    this.load.on('progress', progress => {
      gfx
        .clear()
        .fillStyle(0x666666)
        .fillRectShape(rect)
        .fillStyle(0xffffff)
        .fillRect(rect.x, rect.y, progress * rect.width, rect.height);
    });
  }

  create() {
    this.anims.create({
      key: 'player-walk-left',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 7,
      repeat: -1,
    });

    // this.anims.create({
    //   key: 'player-idle',
    //   frames: [{ key: 'player', frame: 4 }],
    //   frameRate: 20,
    // });

    this.anims.create({
      key: 'player-walk-right',
      frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
      frameRate: 7,
      repeat: -1,
    });

    this.scene.start('game');
  }

  update() {}
}
