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
      this.sprite = this.game.physics.add.sprite(0, 0, character.name, 0);
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
}
