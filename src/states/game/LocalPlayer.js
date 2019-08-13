import Player from './Player';

const PLAYER_VELOCITY = 100;
const PLAYER_JUMP_VELOCITY = 300;
const PLAYER_ROCKET_ACCELERATION_X = 200;
const PLAYER_ROCKET_ACCELERATION_Y = 600;
const MAX_PLAYER_FUEL = 50;

export default class LocalPlayer extends Player {
  constructor(game, character) {
    super(game, character, true);

    this.startTime = 0;
    this.spawning = false;
    this.finished = false;
    this.fuel = 0;
    this.failed = false;

    this.sprite.setSize(30, 54);
    this.sprite.setOffset(0.5, 0.5);
    this.sprite.setBounce(0.0);
    this.sprite.setDepth(3);
    this.sprite.setCollideWorldBounds(false);
  }

  update() {
    super.update();
    this.updateState();
    this.updateMovement();
    this.handleRocketing();
    this.updateAnimations();
    this.handleFailing();
  }

  updateState() {
    const blocked = this.sprite.body.blocked;

    this.flying = !blocked.down;
  }

  updateMovement() {
    const blocked = this.sprite.body.blocked;

    if (this.finished) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    if (this.spawning) {
      this.sprite.setVelocityX(0);
      return;
    }

    if (this.direction === -1 && !blocked.left) {
      if (blocked.down) this.sprite.setVelocityX(-PLAYER_VELOCITY);
    } else if (this.direction === 1 && !blocked.right) {
      if (blocked.down) this.sprite.setVelocityX(PLAYER_VELOCITY);
    }
  }

  handleFailing() {
    if (this.failed) return;
    const didFail = this.sprite.body.bottom >= 0;

    if (didFail) {
      this.failed = true;

      setTimeout(() => {
        this.respawn(this.game.spawnPoint);
      }, 500);
    }
  }

  requestJump() {
    const blocked = this.sprite.body.blocked;

    if (blocked.down && !blocked.up) {
      this.sprite.setVelocityY(-PLAYER_JUMP_VELOCITY);
    } else {
      this.rocketing = true;
    }
  }

  respawn(spawnPoint) {
    this.failed = false;
    this.sprite.setScale(1, 1);
    this.finished = false;
    this.sprite.setPosition(spawnPoint.x, spawnPoint.y, 0, 0);
    this.sprite.setVelocity(0, 0);
    this.direction = spawnPoint.direction;
    this.fuel = 0;
    this.rocketing = false;
    this.spawning = true;

    this.game.tweens.add({
      targets: this.sprite,
      alpha: 0,
      duration: 200,
      repeat: 3,
      onComplete: () => {
        const firstSpawn = this.startTime === 0;

        if (firstSpawn) {
          this.startTime = Date.now();
        }

        this.spawning = false;
        this.sprite.alpha = 1;
      },
    });
  }

  getCompressedModel() {
    return {
      x: this.sprite.body.center.x,
      y: this.sprite.body.center.y,
      d: this.direction,
      r: this.rocketing,
      f: !this.sprite.body.blocked.down,
      s: this.spawning,
    };
  }

  handleRocketing() {
    if (this.rocketing && this.fuel > 0) {
      this.sprite.body.acceleration.set(
        PLAYER_ROCKET_ACCELERATION_X * this.direction,
        -PLAYER_ROCKET_ACCELERATION_Y
      );
      this.fuel--;

      this.emitter.start();
      this.emitter.applyDirection(this.direction);
    } else {
      this.sprite.body.acceleration.set(0, 0);
      this.emitter.stop();
    }

    if (this.sprite.body.blocked.down) {
      this.fuel = MAX_PLAYER_FUEL;
    }
  }

  getTotalTime() {
    return Date.now() - this.startTime;
  }
}
