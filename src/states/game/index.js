import Phaser from 'phaser';
import levels from '../../levels';
import * as obstacleMap from '../../levels/obstacleMap';
import Emitter from './Emitter';
import Opponent from './Opponent';
import Player from './LocalPlayer';

const GRAVITY = 300;
const GRID_SIZE = 60;
const EMIT_UPDATE_DT = 20;

let level;
let startTime;
let rocket;
let rocketDirection = 1;
let rocketSmokeEmitter;
let rocketFireEmitter;
let background;
let platforms;
let leftButton;
let rightButton;

let lastUpdateTime = Date.now();

let opponentsLayer;
let countDownText;

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
    this.level = levels[data.levelIndex];
    this.opponents = [];
    this.socket = window.globalContext.socket;
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    const socket = this.socket;

    socket.removeAllListeners();

    socket.on('STATE_UPDATE', playerModels => {
      playerModels
        .filter(model => model.id !== socket.id)
        .forEach(opponentModel => {
          const localOpponent = this.opponents.find(
            p => p.id === opponentModel.id
          );

          if (localOpponent) {
            localOpponent.applyRemoteState(opponentModel);
          } else {
            this.opponents.push(new Opponent(this, opponentModel));
          }
        });

      this.opponents = this.opponents.filter(opponent => {
        const opponentIncludedInRemoteState = playerModels.some(
          m => m.id === opponent.id
        );

        if (opponentIncludedInRemoteState) {
          return true;
        } else {
          opponent.destroy();
          return false;
        }
      });
    });

    socket.on('COUNTDOWN', count => {
      countDownText.setVisible(true);
      countDownText.setScrollFactor(0);
      countDownText.setText(count === 0 ? 'Go!' : count);
      countDownText.setScale(2);

      this.tweens.add({
        targets: countDownText,
        scale: count === 0 ? 0 : 1,
        duration: count === 0 ? 1000 : 200,
        ease: 'Cubic.easeOut',
        onComplete: () => {},
      });
    });

    socket.on('PLAYER_REACH_GOAL', finishedPlayer => {
      const isSelf = finishedPlayer.id === socket.id;
      const target = isSelf
        ? this.player
        : this.opponents.find(p => p.id === finishedPlayer.id);

      this.tweens.add({
        targets: target.sprite,
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

    platforms = this.physics.add.staticGroup();

    this.decodeLevel(this.level);

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

    rocketSmokeEmitter.stop();
    rocketFireEmitter.stop();

    opponentsLayer = this.add.group();
    opponentsLayer.setDepth(2);

    this.player = new Player(this, window.globalContext.character);
    this.player.respawn(this.spawnPoint);

    const buttonStyle = {
      fontSize: '24px',
      backgroundColor: 'green',
      valign: 'center',
      halign: 'center',
      fixedWidth: width * 0.5,
      fixedHeight: 150,
      align: 'center',
    };

    leftButton = this.add
      .sprite(0, height, 'toggle-direction-button')
      .setOrigin(0, 1)
      .setDepth(10)
      .setScrollFactor(0);
    rightButton = this.add
      .sprite(width * 0.5, height, 'jump-rocket-button')
      .setOrigin(0, 1)
      .setDepth(10)
      .setScrollFactor(0);

    leftButton.setInteractive().on('pointerdown', () => {
      if (this.player.spawning) return;
      this.player.direction *= -1;
    });

    rightButton.setInteractive().on('pointerdown', () => {
      if (this.player.spawning) return;
      this.player.requestJump();
    });

    rightButton.setInteractive().on('pointerup', () => {
      this.player.rocketing = false;
    });

    this.physics.add.collider(this.player.sprite, platforms);
    rocket.body.setSize(40, 60);
    rocket.body.allowGravity = false;

    this.physics.add.overlap(this.player.sprite, rocket, () => {
      if (this.player.sprite.body.blocked.down) {
        if (!this.player.finished) {
          this.player.finished = true;
          const totalTime = Date.now() - this.player.startTime;
          this.socket.emit('PLAYER_REACH_GOAL', { totalTime });
        }
      }
    });

    rocketFireEmitter.startFollow(rocket);
    rocketSmokeEmitter.startFollow(rocket);

    countDownText = this.add.text(width * 0.5, 100, 0, {
      fontSize: 60,
      color: 'orange',
    });
    countDownText.setVisible(false);
    countDownText.setOrigin(0.5, 0.5);
    countDownText.setScrollFactor(0);
  }

  decodeLevel(level) {
    level.tiles.forEach((row, gridY) => {
      row.forEach((value, gridX) => {
        if (value === obstacleMap._) return; //empty space
        if (value === obstacleMap.r || value === obstacleMap.R) {
          rocket = this.physics.add.sprite(
            (gridX + 0.5) * GRID_SIZE,
            -(gridY + 0.5) * GRID_SIZE,
            'rocket',
            value === obstacleMap.r ? 0 : 4
          );
          rocketDirection = value === obstacleMap.r ? -1 : 1;
          return;
        }
        if (value === obstacleMap.s || value === obstacleMap.S) {
          this.spawnPoint = {
            x: (gridX + 0.5) * GRID_SIZE,
            y: -(gridY + 0.5) * GRID_SIZE,
            direction: value === obstacleMap.s ? -1 : 1,
          };
          return;
        }
        //tile variations
        platforms
          .create(
            (gridX + 0.5) * GRID_SIZE,
            Math.round(-(gridY + 0.5) * GRID_SIZE),
            'tiles',
            value
          )
          .refreshBody();
      });
    });
  }

  update() {
    this.updateCamera();
    this.player.update();
    this.emitUpdate();
  }

  updateCamera() {
    if (this.player.finished || this.player.failed) return;

    this.cameras.main.setScroll(
      0,
      this.player.sprite.body.bottom - this.scale.height * 0.6
    );
    background.setPosition(0, this.player.sprite.body.bottom * 0.5);
  }

  emitUpdate(extraProperties = {}) {
    const now = Date.now();
    const sinceLastUpdate = now - lastUpdateTime;
    const shouldUpdate = sinceLastUpdate >= EMIT_UPDATE_DT;

    if (shouldUpdate) {
      const model = this.player.getCompressedModel();

      this.socket.emit('PLAYER_UPDATE', {
        ...model,
        ...extraProperties,
      });

      lastUpdateTime = now;
    }
  }
}
