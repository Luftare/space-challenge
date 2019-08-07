import Phaser from 'phaser';
import level from '../levels/level-0';
import * as obstacleMap from '../levels/obstacleMap';

const GRAVITY = 300;
const PLAYER_VELOCITY = 100;
const PLAYER_JUMP_VELOCITY = 300;
const PLAYER_ROCKET_ACCELERATION_X = 200;
const PLAYER_ROCKET_ACCELERATION_Y = 600;
const MAX_PLAYER_FUEL = 50;
const BOTTOM_MARGIN = 150;
const GRID_SIZE = 60;

let player;
let playerDirection = 1;
let playerStartDirection = 1;
let playerFailed = false;
let playerFuel = 0;
let playerRocketing = false;
let playerFinished = false;
let playerSpawnPoint = { x: 0, y: 0 };
let playerFlashTween;
let playerShrinkTween;
let playerSpawning = false;
let rocket;
let rocketDirection = 1;
let playerRocketSmokeEmitter;
let playerRocketFireEmitter;
let rocketSmokeEmitter;
let rocketFireEmitter;
let background;
let platforms;
let turnToggleInputPressed = false;
let input;
let leftButton;
let rightButton;

function requestPlayerJump(player) {
  const blocked = player.body.blocked;

  if (blocked.down && !blocked.up) {
    player.setVelocityY(-PLAYER_JUMP_VELOCITY);
    return true;
  }

  return false;
}

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

    background = this.add.tileSprite(
      0,
      -height * 2,
      width * 2,
      height * 8,
      'background'
    );

    playerRocketSmokeEmitter = this.add.particles('smoke').createEmitter({
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

    playerRocketFireEmitter = this.add.particles('fire').createEmitter({
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
    });

    rocketSmokeEmitter = this.add.particles('smoke').createEmitter({
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

    rocketFireEmitter = this.add.particles('fire').createEmitter({
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

    playerRocketSmokeEmitter.stop();
    playerRocketFireEmitter.stop();
    rocketSmokeEmitter.stop();
    rocketFireEmitter.stop();

    platforms = this.physics.add.staticGroup();

    level.tiles.forEach((row, gridY) => {
      row.forEach((value, gridX) => {
        if (value === obstacleMap._) return; //empty space
        if (value === obstacleMap.r || value === obstacleMap.R) {
          rocket = this.physics.add.sprite(
            (gridX + 0.5) * GRID_SIZE,
            height - (gridY + 0.5) * GRID_SIZE - BOTTOM_MARGIN,
            'rocket',
            value === obstacleMap.r ? 0 : 4
          );
          rocketDirection = value === obstacleMap.r ? -1 : 1;
          return;
        }
        if (value === obstacleMap.s || value === obstacleMap.S) {
          playerStartDirection = value === obstacleMap.s ? -1 : 1;
          //spawnpoint
          playerSpawnPoint = {
            x: (gridX + 0.5) * GRID_SIZE,
            y: height - (gridY + 0.5) * GRID_SIZE - BOTTOM_MARGIN,
          };
          player;
          return;
        }
        //tile variations
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

    player = this.physics.add.sprite(0, 0, 'player').setSize(30, 50);
    player.setBounce(0.0);
    player.setCollideWorldBounds(false);

    playerFlashTween = this.tweens.add({
      targets: player,
      alpha: 0,
      duration: 200,
      repeat: 3,
      onComplete: () => {
        playerSpawning = false;
        player.alpha = 1;
      },
    });

    this.respawn();

    const buttonStyle = {
      fontSize: '24px',
      backgroundColor: 'green',
      valign: 'center',
      halign: 'center',
      fixedWidth: width * 0.5,
      fixedHeight: BOTTOM_MARGIN,
      align: 'center',
    };

    leftButton = this.add
      .sprite(0, height, 'toggle-direction-button')
      .setOrigin(0, 1)
      .setScrollFactor(0);
    rightButton = this.add
      .sprite(width * 0.5, height, 'jump-rocket-button')
      .setOrigin(0, 1)
      .setScrollFactor(0);

    leftButton.setInteractive().on('pointerdown', () => {
      if (playerSpawning) return;
      playerDirection *= -1;
    });

    rightButton.setInteractive().on('pointerdown', () => {
      if (playerSpawning) return;
      const didJump = requestPlayerJump(player);

      if (!didJump) {
        playerRocketing = true;
      }
    });

    rightButton.setInteractive().on('pointerup', () => {
      playerRocketing = false;
    });

    this.physics.add.collider(player, platforms);
    rocket.body.setSize(40, 60);
    rocket.body.allowGravity = false;
    this.physics.add.overlap(player, rocket, () => {
      if (player.body.blocked.down) {
        if (!playerFinished) {
          playerFinished = true;
          this.tweens.add({
            targets: player,
            x: rocket.body.center.x,
            scale: 0,
            duration: 300,
            repeat: 0,
            onComplete: () => {
              this.tweens.add({
                targets: rocket,
                scaleX: 1.4,
                scaleY: 0.8,
                y: '+=8',
                duration: 80,
                ease: 'Cubic.easeOut',
                yoyo: true,
                onComplete: () => {
                  rocket.play(
                    `rocket-flash-${rocketDirection === -1 ? 'left' : 'right'}`
                  );

                  setTimeout(() => {
                    rocket.play(
                      `rocket-close-hatch-${
                        rocketDirection === -1 ? 'left' : 'right'
                      }`
                    );
                    rocketSmokeEmitter.start();
                    rocketFireEmitter.start();

                    this.tweens.add({
                      targets: rocket,
                      scaleX: 1.8,
                      scaleY: 0.4,
                      y: '+=10',
                      duration: 300,
                      ease: 'Cubic.easeOut',
                      yoyo: true,
                      onComplete: () => {
                        this.tweens.add({
                          targets: rocket,
                          y: '-=1500',
                          duration: 3000,
                          ease: 'Cubic.easeOut',
                          onComplete: () => {
                            this.scene.start('score');
                          },
                        });
                      },
                    });
                  }, 1000);
                },
              });
            },
          });
        }
      }
    });

    input = this.input.keyboard.createCursorKeys();

    playerRocketSmokeEmitter.startFollow(player);
    playerRocketFireEmitter.startFollow(player);
    rocketFireEmitter.startFollow(rocket);
    rocketSmokeEmitter.startFollow(rocket);
  }

  update() {
    this.updateCamera();

    if (!playerFailed) {
      this.handleInput();
      this.handleFailing();
    }

    this.updateMovement();
    this.updateAnimations();
  }

  updateCamera() {
    if (playerFinished) return;

    const playerGameY =
      player.body.bottom + GRID_SIZE * 3 - this.game.scale.height;

    if (playerGameY < 0) {
      this.cameras.main.setScroll(
        0,
        playerGameY + this.game.scale.height * 0.15
      );
      background.setPosition(0, playerGameY * 0.5);
    }
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
      playerRocketSmokeEmitter.start();
      playerRocketFireEmitter.start();
      playerRocketSmokeEmitter.setSpeedX(-playerDirection * 50);
      playerRocketFireEmitter.setSpeedX(-playerDirection * 50);
    } else {
      playerRocketSmokeEmitter.stop();
      playerRocketFireEmitter.stop();
      player.body.acceleration.set(0, 0);
    }

    if (blocked.down) {
      playerFuel = MAX_PLAYER_FUEL;
    }
  }

  updateMovement() {
    const blocked = player.body.blocked;

    if (playerFinished) {
      player.setVelocity(0, 0);
      return;
    }

    if (playerSpawning) {
      player.setVelocityX(0);
      return;
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
  }

  updateAnimations() {
    const blocked = player.body.blocked;

    if (playerFinished) {
      player.play(
        playerDirection === 1 ? 'player-stand-right' : 'player-stand-left',
        true
      );
      return;
    }

    if (playerSpawning) {
      player.play(
        playerDirection === 1 ? 'player-stand-right' : 'player-stand-left',
        true
      );
      return;
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
    player.setScale(1, 1);
    playerFinished = false;
    player.setPosition(playerSpawnPoint.x, playerSpawnPoint.y, 0, 0);
    player.setVelocity(0, 0);
    playerDirection = playerStartDirection;
    playerFuel = 0;
    playerRocketing = false;
    playerSpawning = true;
    playerFlashTween.restart();
  }
}
