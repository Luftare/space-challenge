import Emitter from './Emitter';

export default class Opponent {
  constructor(game, model) {
    this.game = game;
    this.emitter = new Emitter(game, model.character);
    this.sprite = game.add.sprite(model.x, model.y, model.character.name, 0);
    this.nameTag = game.add.text(0, 0, model.name);
    this.nameTag.setOrigin(0.5, 0.5);
    this.sprite.setAlpha(0.6);
    this.emitter.follow(this.sprite);
    this.id = model.id;
  }

  destroy() {
    this.sprite.destroy();
    this.nameTag.destroy();
    this.emitter.destroy();
  }

  applyRemoteState(state) {
    this.updatePosition(state);
    this.updateAnimations(state);
    this.updateEmitter(state);
  }

  updatePosition(state) {
    this.sprite.setPosition(state.x, state.y);
    this.nameTag.setPosition(state.x, state.y - 40);
  }

  updateAnimations(state) {
    const flying = state.f;
    const rocketing = state.r;
    const direction = state.d;
    const standing = state.s;
    const name = state.character.name;

    if (standing) {
      return this.sprite.play(
        direction === 1 ? `${name}-stand-right` : `${name}-stand-left`,
        true
      );
    }

    if (flying) {
      return this.sprite.play(
        direction === 1 ? `${name}-flying-right` : `${name}-flying-left`,
        true
      );
    }
    if (rocketing) {
      return this.sprite.play(
        direction === 1 ? `${name}-rocketing-right` : `${name}-rocketing-left`,
        true
      );
    }
    return this.sprite.play(
      direction === 1 ? `${name}-walk-right` : `${name}-walk-left`,
      true
    );
  }

  updateEmitter(state) {
    const rocketing = state.r;

    if (rocketing) {
      this.emitter.start();
      this.emitter.applyDirection(state.d);
    } else {
      this.emitter.stop();
    }
  }
}
