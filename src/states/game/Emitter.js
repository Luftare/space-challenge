export default class Emitter {
  constructor(game, config) {
    this.emitters = [];

    if (config.smoke) {
      const smoke = game.add.particles('smoke').createEmitter({
        x: { min: -10, max: 10 },
        y: { min: 20, max: 70 },
        speedY: { min: 50, max: 150 },
        speedX: { min: -50, max: 50 },
        rotate: { min: 0, max: 360 },
        scale: { start: 0.2, end: 0.7 },
        gravityY: 0,
        quantity: 1,
        lifespan: { min: 250, max: 800 },
        tint: config.smokeTint,
        depth: 1,
      });
      smoke.stop();
      this.emitters.push(smoke);
    }

    if (config.fire) {
      const fire = game.add.particles('fire').createEmitter({
        x: { min: -5, max: 5 },
        y: 20,
        speedY: { min: 100, max: 180 },
        speedX: { min: -50, max: 50 },
        rotate: { min: 0, max: 360 },
        gravityY: 0,
        scale: { start: 0.5, end: 0.1 },
        quantity: 1,
        lifespan: { min: 320, max: 560 },
        blendMode: 'ADD',
        depth: 1,
      });
      fire.stop();
      this.emitters.push(fire);
    }
  }

  destroy() {
    this.emitters.forEach(emitter => {
      emitter.stop();
    });
  }

  follow(target) {
    this.emitters.forEach(emitter => {
      emitter.startFollow(target);
    });
  }

  start() {
    this.emitters.forEach(emitter => {
      emitter.start();
    });
  }

  stop() {
    this.emitters.forEach(emitter => {
      emitter.stop();
    });
  }

  applyDirection(direction, speedX = 50) {
    this.emitters.forEach(emitter => {
      emitter.setSpeedX(-direction * speedX);
    });
  }
}
