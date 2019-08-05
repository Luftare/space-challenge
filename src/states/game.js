import Phaser from 'phaser';

const GRAVITY = 300;
const PLAYER_VELOCITY = 100;
const PLAYER_JUMP_VELOCITY = 300;
const PLAYER_ROCKET_ACCELERATION_X = 200;
const PLAYER_ROCKET_ACCELERATION_Y = 600;
const MAX_PLAYER_FUEL = 50;
const BOTTOM_MARGIN = 120;
const GRID_SIZE = 60;

let player;
let playerDirection = -1;
let playerFailed = false;
let playerFuel = 0;
let playerRocketing = false;
let playerSpawnPoint = { x: 0, y: 0 };
let playerFlashTween;
let rocketEmitter;
let platforms;
let turnToggleInputPressed = false;
let input;
let leftButton;
let rightButton;

function requestPlayerJump(player) {
  const blocked = player.body.blocked;

  if (blocked.down && !blocked.up) {
    player.setVelocityY(-PLAYER_JUMP_VELOCITY);
    playerFuel = MAX_PLAYER_FUEL;
    return true;
  }

  return false;
}

const _ = null;

const tiles = [
  [_, _, _, _, _, _, _, _, 5, _],
  [_, _, _, _, _, _, _, _, _, _],
  [_, 0, 3, 6, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, 3, 2, 1, _],
  [_, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _],
  [_, 1, 0, 4, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, 3, 0, 2, 1],
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'game',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: GRAVITY },
          debug: false,
        },
      },
    });
  }

  create() {
    const { width, height } = this.game.scale;

    playerSpawnPoint = {
      x: width - 25,
      y: height - GRID_SIZE * 1.5 - BOTTOM_MARGIN,
    };

    player = this.physics.add.sprite(0, 0, 'player').setSize(16, 48);
    player.setBounce(0.0);
    player.setCollideWorldBounds(false);

    playerFlashTween = this.tweens.add({
      targets: player,
      alpha: 0,
      duration: 200,
      repeat: 2,
      onComplete: () => {
        player.alpha = 1;
      },
    });

    this.respawn();

    platforms = this.physics.add.staticGroup();

    tiles.reverse().forEach((row, gridY) => {
      row.forEach((value, gridX) => {
        if (value === null) return;
        platforms
          .create(
            (gridX + 0.5) * GRID_SIZE,
            height - (gridY + 0.5) * GRID_SIZE - BOTTOM_MARGIN,
            'tiles',
            value
          )
          .refreshBody();
      });
    });

    const buttonStyle = {
      fontSize: '24px',
      backgroundColor: 'green',
      valign: 'center',
      halign: 'center',
      fixedWidth: width * 0.5,
      fixedHeight: BOTTOM_MARGIN,
      align: 'center',
    };

    leftButton = this.add.text(
      0,
      height - BOTTOM_MARGIN,
      'käänny',
      buttonStyle
    );
    rightButton = this.add.text(width * 0.5, height - BOTTOM_MARGIN, 'hyppää', {
      ...buttonStyle,
      backgroundColor: 'red',
    });

    leftButton.setInteractive().on('pointerdown', () => {
      playerDirection *= -1;
    });

    rightButton.setInteractive().on('pointerdown', () => {
      const didJump = requestPlayerJump(player);

      if (!didJump) {
        playerRocketing = true;
      }
    });

    rightButton.setInteractive().on('pointerup', () => {
      playerRocketing = false;
    });

    this.physics.add.collider(player, platforms);

    input = this.input.keyboard.createCursorKeys();

    rocketEmitter = this.add.particles('smoke').createEmitter({
      x: 0,
      y: 23,
      speedY: { min: 250, max: 450 },
      speedX: { min: -50, max: 50 },
      rotate: { min: 0, max: 360 },
      gravityY: 0,
      scale: 0.1,
      quantity: 1,
      lifespan: { min: 150, max: 300 },
    });

    rocketEmitter.setAlpha(0.5, 1, 300);
    rocketEmitter.stop();
    rocketEmitter.startFollow(player);
  }

  update() {
    if (!playerFailed) {
      this.handleInput();
      this.handleFailing();
    }
    window.player = player;
    window.emitter = rocketEmitter;
  }

  handleInput() {
    const blocked = player.body.blocked;

    if (input.space.isDown && !turnToggleInputPressed) {
      turnToggleInputPressed = true;
      playerDirection *= -1;
    }

    if (!input.space.isDown) {
      turnToggleInputPressed = false;
    }

    if (input.up.isDown) {
      requestPlayerJump(player);
    }

    if (playerRocketing && playerFuel > 0) {
      player.body.acceleration.set(
        PLAYER_ROCKET_ACCELERATION_X * playerDirection,
        -PLAYER_ROCKET_ACCELERATION_Y
      );
      playerFuel--;
      rocketEmitter.start();
      rocketEmitter.setSpeedX(-playerDirection * 50);
    } else {
      rocketEmitter.stop();
      player.body.acceleration.set(0, 0);
    }

    if (playerDirection === -1 && !blocked.left) {
      if (blocked.down) {
        player.setVelocityX(-PLAYER_VELOCITY);
      }
    } else if (playerDirection === 1 && !blocked.right) {
      if (blocked.down) {
        player.setVelocityX(PLAYER_VELOCITY);
      }
    }

    if (blocked.down) {
      player.play(
        playerDirection === 1 ? 'player-walk-right' : 'player-walk-left',
        true
      );
    } else {
      if (!playerRocketing) {
        player.play(
          playerDirection === 1 ? 'player-flying-right' : 'player-flying-left',
          true
        );
      } else {
        player.play(
          playerDirection === 1
            ? 'player-rocketing-right'
            : 'player-rocketing-left',
          true
        );
      }
    }
  }

  handleFailing() {
    const didFail = player.body.bottom >= this.game.scale.height;

    if (didFail) {
      playerFailed = true;
      setTimeout(this.respawn, 500);
    }
  }

  respawn() {
    playerFailed = false;
    player.setPosition(playerSpawnPoint.x, playerSpawnPoint.y, 0, 0);
    player.setVelocity(0, 0);
    playerDirection = -1;
    playerFuel = 0;
    playerRocketing = false;
    playerFlashTween.restart();
  }
}
