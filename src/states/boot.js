export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'boot' });
  }

  preload() {
    this.load.spritesheet('player', require('../assets/player.png'), {
      frameWidth: 40,
      frameHeight: 55,
    });
    this.load.spritesheet('rocket', require('../assets/rocket.png'), {
      frameWidth: 60,
      frameHeight: 60,
    });
    this.load.spritesheet('tiles', require('../assets/tiles.png'), {
      frameWidth: 60,
      frameHeight: 60,
    });
    this.load.image('background', require('../assets/background.png'));
    this.load.image(
      'jump-rocket-button',
      require('../assets/jumpRocketButton.png')
    );
    this.load.image(
      'toggle-direction-button',
      require('../assets/toggleDirectionButton.png')
    );
    this.load.image('smoke', require('../assets/smoke.png'));
    this.load.image('fire', require('../assets/fire.png'));

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
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'player-stand-left',
      frames: [{ key: 'player', frame: 0 }],
      frameRate: 20,
    });

    this.anims.create({
      key: 'player-stand-right',
      frames: [{ key: 'player', frame: 9 }],
      frameRate: 20,
    });

    this.anims.create({
      key: 'player-flying-left',
      frames: [{ key: 'player', frame: 2 }],
      frameRate: 20,
    });

    this.anims.create({
      key: 'player-flying-right',
      frames: [{ key: 'player', frame: 10 }],
      frameRate: 20,
    });

    this.anims.create({
      key: 'player-rocketing-left',
      frames: [{ key: 'player', frame: 16 }],
      frameRate: 20,
    });

    this.anims.create({
      key: 'player-rocketing-right',
      frames: [{ key: 'player', frame: 17 }],
      frameRate: 5,
    });

    this.anims.create({
      key: 'player-walk-right',
      frames: this.anims.generateFrameNumbers('player', { start: 8, end: 15 }),
      frameRate: 10,
      repeat: -1,
    });

    this.anims.create({
      key: 'rocket-close-hatch-left',
      frames: this.anims.generateFrameNumbers('rocket', { start: 0, end: 2 }),
      frameRate: 15,
    });

    this.anims.create({
      key: 'rocket-close-hatch-right',
      frames: this.anims.generateFrameNumbers('rocket', { start: 4, end: 6 }),
      frameRate: 15,
    });

    this.anims.create({
      key: 'rocket-flash-left',
      frames: [{ key: 'rocket', frame: 0 }, { key: 'rocket', frame: 3 }],
      frameRate: 12,
      yoyo: true,
    });

    this.anims.create({
      key: 'rocket-flash-right',
      frames: [{ key: 'rocket', frame: 4 }, { key: 'rocket', frame: 7 }],
      frameRate: 12,
      yoyo: true,
    });

    this.scene.start('game');
  }

  update() {}
}
