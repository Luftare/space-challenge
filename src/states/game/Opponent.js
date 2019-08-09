import Player from './Player';

export default class Opponent extends Player {
  constructor(game, model) {
    super(game, model.character);
    this.nameTag = game.add.text(0, 0, model.name);
    this.nameTag.setOrigin(0.5, 0.5);
    this.sprite.setAlpha(0.6);
    this.id = model.id;
  }

  destroy() {
    this.sprite.destroy();
    this.nameTag.destroy();
    this.emitter.destroy();
  }

  applyRemoteState(state) {
    this.updateLocalState(state);
    this.updatePosition(state);
    super.update();
  }

  updateLocalState(state) {
    this.direction = state.d;
    this.flying = state.f;
    this.rocketing = state.r;
    this.spawning = state.s;
  }

  updatePosition(state) {
    this.sprite.setPosition(state.x, state.y);
    this.nameTag.setPosition(state.x, state.y - 40);
  }
}
