export const characters = [
  { name: 'human', fire: true, smoke: true, smokeTint: 0xffffff },
  { name: 'robot', fire: true, smoke: true, smokeTint: 0x555555 },
  { name: 'alien', fire: false, smoke: true, smokeTint: 0xad73ea },
];

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'boot' });
  }

  preload() {
    this.load.spritesheet('human', require(`../assets/human.png`), {
      frameWidth: 40,
      frameHeight: 55,
    });

    this.load.spritesheet('robot', require(`../assets/robot.png`), {
      frameWidth: 40,
      frameHeight: 55,
    });

    this.load.spritesheet('alien', require(`../assets/alien.png`), {
      frameWidth: 40,
      frameHeight: 55,
    });

    this.load.image('human-avatar', require('../assets/human-avatar.png'));
    this.load.image('robot-avatar', require('../assets/robot-avatar.png'));
    this.load.image('alien-avatar', require('../assets/alien-avatar.png'));

    this.load.spritesheet('rocket', require('../assets/rocket.png'), {
      frameWidth: 60,
      frameHeight: 60,
    });

    this.load.spritesheet('tiles', require('../assets/tiles.png'), {
      frameWidth: 60,
      frameHeight: 60,
    });

    this.load.spritesheet('items', require('../assets/items.png'), {
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
    characters.forEach(({ name }) => {
      this.anims.create({
        key: `${name}-walk-left`,
        frames: this.anims.generateFrameNumbers(name, {
          start: 0,
          end: 7,
        }),
        frameRate: 10,
        repeat: -1,
      });

      this.anims.create({
        key: `${name}-walk-right`,
        frames: this.anims.generateFrameNumbers(name, {
          start: 8,
          end: 15,
        }),
        frameRate: 10,
        repeat: -1,
      });

      this.anims.create({
        key: `${name}-stand-left`,
        frames: [{ key: name, frame: 0 }],
        frameRate: 20,
      });

      this.anims.create({
        key: `${name}-stand-right`,
        frames: [{ key: name, frame: 9 }],
        frameRate: 20,
      });

      this.anims.create({
        key: `${name}-flying-left`,
        frames: [{ key: name, frame: 18 }],
        frameRate: 20,
      });

      this.anims.create({
        key: `${name}-flying-right`,
        frames: [{ key: name, frame: 19 }],
        frameRate: 20,
      });

      this.anims.create({
        key: `${name}-rocketing-left`,
        frames: [{ key: name, frame: 16 }],
        frameRate: 20,
      });

      this.anims.create({
        key: `${name}-rocketing-right`,
        frames: [{ key: name, frame: 17 }],
        frameRate: 5,
      });
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

    this.scene.start('login');
  }

  update() {}
}
