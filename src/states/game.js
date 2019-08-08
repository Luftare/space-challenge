import Phaser from 'phaser';
import levels from '../levels';
import * as obstacleMap from '../levels/obstacleMap';

const GRAVITY = 300;
const PLAYER_VELOCITY = 100;
const PLAYER_JUMP_VELOCITY = 300;
const PLAYER_ROCKET_ACCELERATION_X = 200;
const PLAYER_ROCKET_ACCELERATION_Y = 600;
const MAX_PLAYER_FUEL = 50;
const BOTTOM_MARGIN = 150;
const GRID_SIZE = 60;
const EMIT_UPDATE_DT = 20;

let level;
let startTime;
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
let character;
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

let socket;
let lastUpdateTime = Date.now();

let remotePlayers = [];
let remotePlayerSprites = {};

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

  init(data) {
    level = levels[data.levelIndex];
    remotePlayers = [];
    remotePlayerSprites = {};

    socket = window.globalContext.socket;
    character = window.globalContext.character;
    socket.removeAllListeners();

    socket.on('STATE_UPDATE', updatedRemotePlayers => {
      updatedRemotePlayers.forEach(updatedRemotePlayer => {
        const localRemotePlayer = remotePlayers.find(
          p => p.id === updatedRemotePlayer.id
        );

        const isSelf = updatedRemotePlayer.id === socket.id;
        if (isSelf) return;

        if (localRemotePlayer) {
          localRemotePlayer.sprite.setPosition(
            updatedRemotePlayer.x,
            updatedRemotePlayer.y
          );
          localRemotePlayer.sprite.setFrame(
            updatedRemotePlayer.d === -1 ? 0 : 8
          );
        } else {
          remotePlayers.push({
            ...updatedRemotePlayer,
            sprite: this.add.sprite(
              updatedRemotePlayer.x,
              updatedRemotePlayer.y,
              'player',
              0
            ),
          });
        }
      });

      remotePlayers = remotePlayers.filter(remotePlayer => {
        const playerIncludedInRemoteState = updatedRemotePlayers.some(
          p => p.id === remotePlayer.id
        );

        if (playerIncludedInRemoteState) {
          return true;
        } else {
          remotePlayer.sprite.destroy();
          return false;
        }
      });
    });

    socket.on('PLAYER_REACH_GOAL', finishedPlayer => {
      const isSelf = finishedPlayer.id === socket.id;
      const sprite = isSelf
        ? player
        : remotePlayers.find(p => p.id === finishedPlayer.id).sprite;

      this.tweens.add({
        targets: sprite,
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
            },
          });
        },
      });
    });

    socket.on('GAME_OVER', playerScores => {
      rocket.play(
        `rocket-close-hatch-${rocketDirection === -1 ? 'left' : 'right'}`
      );

      setTimeout(() => {
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
                this.scene.start('score', { playerScores });
              },
            });
          },
        });
      }, 500);
    });
  }

  create() {
    const { width, height } = this.game.scale;

    background = this.add.tileSprite(
      0,
      -height * 3,
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
            -(gridY + 0.5) * GRID_SIZE - BOTTOM_MARGIN,
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
            y: -(gridY + 0.5) * GRID_SIZE - BOTTOM_MARGIN,
          };
          return;
        }
        //tile variations
        platforms
          .create(
            (gridX + 0.5) * GRID_SIZE,
            Math.round(-(gridY + 0.5) * GRID_SIZE - BOTTOM_MARGIN),
            'tiles',
            value
          )
          .refreshBody();
      });
    });

    player = this.physics.add.sprite(0, 0, 'player').setSize(30, 54);
    player.setOffset(0.5, 0.5);
    player.setBounce(0.0);
    player.setCollideWorldBounds(false);

    playerFlashTween = this.tweens.add({
      targets: player,
      alpha: 0,
      duration: 200,
      repeat: 3,
      onComplete: () => {
        const firstSpawn = !startTime;
        if (firstSpawn) {
          startTime = Date.now();
        }
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
          const totalTime = Date.now() - startTime;
          socket.emit('PLAYER_REACH_GOAL', { totalTime });
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

    this.emitUpdate();
  }

  updateCamera() {
    if (playerFinished || playerFailed) return;

    this.cameras.main.setScroll(
      0,
      player.body.bottom - this.scale.height * 0.6
    );
    background.setPosition(0, player.body.bottom * 0.5);
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

    if (playerFinished || playerSpawning) {
      player.play(
        playerDirection === 1
          ? `${character}-stand-right`
          : `${character}-stand-left`,
        true
      );
      return;
    }

    if (blocked.down) {
      player.play(
        playerDirection === 1
          ? `${character}-walk-right`
          : `${character}-walk-left`,
        true
      );
    } else {
      if (!playerRocketing) {
        player.play(
          playerDirection === 1
            ? `${character}-flying-right`
            : `${character}-flying-left`,
          true
        );
      } else {
        player.play(
          playerDirection === 1
            ? `${character}-rocketing-right`
            : `${character}-rocketing-left`,
          true
        );
      }
    }
  }

  handleFailing() {
    const didFail = player.body.bottom >= 0;

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

  emitUpdate(extraProperties = {}) {
    const now = Date.now();
    const sinceLastUpdate = now - lastUpdateTime;
    const shouldUpdate = sinceLastUpdate >= EMIT_UPDATE_DT;

    if (shouldUpdate) {
      socket.emit('PLAYER_UPDATE', {
        x: player.body.center.x,
        y: player.body.center.y,
        d: playerDirection,
        ...extraProperties,
      });

      lastUpdateTime = now;
    }
  }
}
