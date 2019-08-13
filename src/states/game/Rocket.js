export default class Rocket {
  constructor(game, x, y, direction) {
    this.game = game;

    this.smokeEmitter = game.add.particles('smoke').createEmitter({
      x: { min: -10, max: 10 },
      y: { min: 20, max: 70 },
      speedY: { min: 50, max: 150 },
      speedX: { min: -50, max: 50 },
      rotate: { min: 0, max: 360 },
      scale: { start: 0.2, end: 0.7 },
      gravityY: 0,
      quantity: 1,
      lifespan: { min: 250, max: 800 },
    });

    this.fireEmitter = game.add.particles('fire').createEmitter({
      x: { min: -10, max: 10 },
      y: 40,
      speedY: { min: 100, max: 180 },
      speedX: { min: -50, max: 50 },
      rotate: { min: 0, max: 360 },
      gravityY: 0,
      scale: { start: 0.8, end: 0.1 },
      quantity: 1,
      lifespan: { min: 320, max: 560 },
      blendMode: 'ADD',
    });

    this.smokeEmitter.stop();
    this.fireEmitter.stop();

    this.sprite = game.physics.add.sprite(
      x,
      y,
      'rocket',
      direction === -1 ? 0 : 4
    );
    this.sprite.body.setSize(40, 60);
    this.sprite.body.allowGravity = false;

    this.smokeEmitter.startFollow(this.sprite);
    this.fireEmitter.startFollow(this.sprite);
  }

  receivePlayer() {
    this.game.tweens.add({
      targets: this.sprite,
      scaleX: 1.4,
      scaleY: 0.8,
      y: '+=8',
      duration: 80,
      ease: 'Cubic.easeOut',
      yoyo: true,
      onComplete: () => {
        this.sprite.play(
          `rocket-flash-${this.direction === -1 ? 'left' : 'right'}`
        );
      },
    });
  }

  depart(onComplete) {
    this.closeHatch();

    setTimeout(() => {
      this.startEmitters();

      this.launch(onComplete);
    }, 500);
  }

  closeHatch() {
    this.sprite.play(
      `rocket-close-hatch-${this.direction === -1 ? 'left' : 'right'}`
    );
  }

  startEmitters() {
    this.smokeEmitter.start();
    this.fireEmitter.start();
  }

  launch(onComplete) {
    this.game.tweens.add({
      targets: this.sprite,
      scaleX: 1.8,
      scaleY: 0.4,
      y: '+=10',
      duration: 300,
      ease: 'Cubic.easeOut',
      yoyo: true,
      onComplete: () => {
        this.game.tweens.add({
          targets: this.sprite,
          y: '-=1500',
          duration: 3000,
          ease: 'Cubic.easeOut',
          onComplete,
        });
      },
    });
  }
}
