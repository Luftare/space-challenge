import Phaser from 'phaser';
import levels from '../../levels';
import * as obstacleMap from '../../levels/obstacleMap';
import Emitter from './Emitter';
import Opponent from './Opponent';
import Player from './LocalPlayer';
import Rocket from './Rocket';
import ClientConnection from './ClientConnection';

const GRAVITY = 300;
const GRID_SIZE = 60;

let level;
let background;
let platforms;
let leftButton;
let rightButton;

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
    this.connection = new ClientConnection(this, window.globalContext.socket);
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
      this.handleLeftInputDown();
    });

    rightButton.setInteractive().on('pointerdown', () => {
      this.handleRightInputDown();
    });

    rightButton.setInteractive().on('pointerup', () => {
      this.handleRightInputUp();
    });

    this.input.keyboard.on('keydown-O', () => {
      this.handleLeftInputDown();
    });

    this.input.keyboard.on('keydown-P', () => {
      this.handleRightInputDown();
    });

    this.input.keyboard.on('keyup-P', () => {
      this.handleRightInputUp();
    });

    this.physics.add.collider(this.player.sprite, platforms);

    this.physics.add.overlap(this.player.sprite, this.rocket.sprite, () => {
      if (this.player.sprite.body.blocked.down) {
        if (!this.player.finished) {
          this.player.finished = true;
          const totalTime = this.player.getTotalTime();
          this.connection.handlePlayerReachGoal(totalTime);
        }
      }
    });

    this.GUIMessage = this.add.text(width * 0.5, 100, 0, {
      fontSize: 60,
      color: 'orange',
    });
    this.GUIMessage.setVisible(false);
    this.GUIMessage.setOrigin(0.5, 0.5);
    this.GUIMessage.setScrollFactor(0);
  }

  flashMessage(text) {
    this.GUIMessage.setVisible(true);
    this.GUIMessage.setText(text);
    this.GUIMessage.setScale(2);

    this.tweens.add({
      targets: this.GUIMessage,
      scale: 1,
      duration: 300,
      ease: 'Cubic.easeOut',
    });
  }

  handleLeftInputDown() {
    if (this.player.spawning) return;
    this.player.direction *= -1;
  }

  handleRightInputDown() {
    if (this.player.spawning) return;
    this.player.requestJump();
  }

  handleRightInputUp() {
    this.player.rocketing = false;
  }

  decodeLevel(level) {
    level.tiles.forEach((row, gridY) => {
      row.forEach((value, gridX) => {
        const x = (gridX + 0.5) * GRID_SIZE;
        const y = -(gridY + 0.5) * GRID_SIZE;
        if (value === obstacleMap._) return; //empty space
        if (value === obstacleMap.r || value === obstacleMap.R) {
          const direction = value === obstacleMap.r ? -1 : 1;
          this.rocket = new Rocket(this, x, y, direction);
          return;
        }
        if (value === obstacleMap.s || value === obstacleMap.S) {
          this.spawnPoint = {
            x,
            y,
            direction: value === obstacleMap.s ? -1 : 1,
          };
          return;
        }
        //tile variations
        platforms.create(x, y, 'tiles', value).refreshBody();
      });
    });
  }

  update() {
    this.updateCamera();
    this.player.update();
    this.connection.emitUpdate();
  }

  updateCamera() {
    if (this.player.finished || this.player.failed) return;

    this.cameras.main.setScroll(
      0,
      this.player.sprite.body.bottom - this.scale.height * 0.6
    );
    background.setPosition(0, this.player.sprite.body.bottom * 0.5);
  }
}
