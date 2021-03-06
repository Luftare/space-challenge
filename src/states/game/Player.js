import Emitter from './Emitter';

export default class Player {
  constructor(game, character, enablePhysics) {
    this.game = game;
    this.character = character;
    this.flying = false;
    this.spawning = false;
    this.rocketing = false;
    this.direction = 1;
    this.emitter = new Emitter(game, character);

    if (enablePhysics) {
      this.sprite = this.game.physics.add
        .sprite(0, 0, character.name, 0)
        .setOrigin(0.5);
    } else {
      this.sprite = this.game.add.sprite(0, 0, character.name, 0);
    }
    this.emitter.follow(this.sprite);
  }

  update() {
    this.updateAnimations();
    this.updateEmitter();
  }

  updateAnimations() {
    const { spawning, flying, rocketing, direction, character } = this;
    const name = character.name;

    if (spawning) {
      return this.sprite.play(
        direction === 1 ? `${name}-stand-right` : `${name}-stand-left`,
        true
      );
    }
    if (rocketing) {
      return this.sprite.play(
        direction === 1 ? `${name}-rocketing-right` : `${name}-rocketing-left`,
        true
      );
    }
    if (flying) {
      return this.sprite.play(
        direction === 1 ? `${name}-flying-right` : `${name}-flying-left`,
        true
      );
    }
    return this.sprite.play(
      direction === 1 ? `${name}-walk-right` : `${name}-walk-left`,
      true
    );
  }

  updateEmitter() {
    if (this.rocketing) {
      this.emitter.start();
      this.emitter.applyDirection(this.direction);
    } else {
      this.emitter.stop();
    }
  }

  shrinkTo(x, y, onComplete) {
    this.game.tweens.add({
      targets: this.sprite,
      scale: 0,
      duration: 400,
      repeat: 0,
      x,
      y,
      onComplete,
    });
  }

  spinOnce() {
    this.game.add.tween({
      targets: this.sprite,
      rotation: -Math.PI * 2,
      duration: 400,
    });
  }

  taunt(message) {
    const taunt = this.game.add
      .text(this.sprite.x, this.sprite.y - 15, message, {
        fontSize: 24,
        color: 'yellow',
      })
      .setScale(0.5);

    this.game.tweens.add({
      targets: taunt,
      y: this.sprite.y - Phaser.Math.FloatBetween(100, 160),
      x: this.sprite.x - Phaser.Math.FloatBetween(-50, 50),
      scale: 1,
      duration: 1000,
      onComplete: () => {
        taunt.destroy();
      },
    });
  }
}
