import Phaser from 'phaser';
import levels from '../../levels';
import * as obstacleMap from '../../levels/obstacleMap';
import Emitter from './Emitter';
import Opponent from './Opponent';
import Player from './LocalPlayer';
import Rocket from './Rocket';
import ClientConnection from './ClientConnection';
import { mockIo } from '../../utils';
import { smallButtonStyle, cornerOffset } from '../style';

const GRAVITY = 300;
const GRID_SIZE = 60;
const taunts = ['OMG', '🎵', '❤️', 'oops', 'LOL'];

let level;
let background;

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
    this.solo = data.solo || window.globalContext.levelEditMode;
    this.character = window.globalContext.character;
    this.levelIndex = data.levelIndex;
    this.level = levels[data.levelIndex];
    const socket = this.solo ? mockIo() : window.globalContext.socket;
    this.connection = new ClientConnection(this, socket);
  }

  create() {
    this.width = this.game.scale.width;
    this.height = this.game.scale.height;

    background = this.add.tileSprite(
      0,
      -this.height * 3,
      this.width * 2,
      this.height * 8,
      'background'
    );

    this.platforms = this.physics.add.staticGroup();
    this.blackHoles = this.physics.add.staticGroup();
    this.fuelResupplies = this.physics.add.staticGroup();

    this.decodeLevel(this.level);

    this.player = new Player(this, this.character);
    this.player.respawn(this.spawnPoint);

    this.setupCollisionHandlers();
    this.setupGUI();
    this.setupKeyboardInput();
  }

  setupKeyboardInput() {
    this.input.keyboard.on('keydown-O', () => {
      this.handleLeftInputDown();
    });

    this.input.keyboard.on('keydown-P', () => {
      this.handleRightInputDown();
    });

    this.input.keyboard.on('keyup-P', () => {
      this.handleRightInputUp();
    });

    if (this.solo) {
      this.input.keyboard.on('keydown-R', () => {
        this.handleReset();
      });
    }
  }

  flashMessage(text) {
    this.GUIMessage.setVisible(true)
      .setText(text)
      .setScale(2);

    this.tweens.add({
      targets: this.GUIMessage,
      scale: 1,
      duration: 300,
      ease: 'Cubic.easeOut',
    });
  }

  setupGUI() {
    this.GUIMessage = this.add
      .text(this.width * 0.5, 100, 0, {
        fontSize: 60,
        color: 'yellow',
        shadow: {
          offsetX: 3,
          offsetY: 4,
          color: 'black',
          blur: 0,
          fill: true,
        },
      })
      .setVisible(false)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0);

    this.fuelBar = new Phaser.Geom.Rectangle(0, 0, this.width, 8);
    this.fuelBarGraphics = this.add.graphics({
      x: 0,
      y: 0,
      fillStyle: { color: 0xeeee00 },
    });
    this.fuelBarGraphics.fillRectShape(this.fuelBar);
    this.fuelBarGraphics.setScrollFactor(0);

    if (this.solo) {
      this.add
        .text(cornerOffset.x, cornerOffset.y, 'levels', smallButtonStyle)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setInteractive()
        .on('pointerdown', () => {
          this.scene.start('selectLevel');
        });

      this.add
        .text(
          this.width - cornerOffset.x,
          cornerOffset.y,
          'reset',
          smallButtonStyle
        )
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0)
        .setInteractive()
        .on('pointerdown', () => {
          this.handleReset();
        });
    } else {
      this.input.keyboard.on('keydown', e => {
        const numberKey = parseInt(e.key);
        if (!isNaN(numberKey)) {
          const tauntIndex = numberKey - 1;
          const taunt = taunts[tauntIndex];

          if (taunt) {
            this.player.taunt(taunt);
          }
        }
      });

      taunts.forEach((taunt, i, taunts) => {
        const tauntCenterDistance = this.width / (taunts.length + 1);
        const startX = tauntCenterDistance;
        const x = startX + tauntCenterDistance * i;

        this.add
          .text(x, this.height - 190, taunt, {
            color: 'white',
            fontSize: 25,
            backgroundColor: '#444444',
            padding: 12,
          })
          .setOrigin(0.5, 0.5)
          .setScrollFactor(0)
          .setInteractive()
          .setDepth(3)
          .on('pointerdown', () => {
            this.player.taunt(taunt);
          });
      });
    }

    this.leftButton = this.add
      .sprite(0, this.height, 'toggle-direction-button')
      .setOrigin(0, 1)
      .setDepth(10)
      .setScrollFactor(0)
      .setInteractive()
      .on('pointerdown', () => {
        this.handleLeftInputDown();
        this.leftButton.setTint(0x999999);
      })
      .on('pointerup', () => {
        this.leftButton.setTint(0xffffff);
      });

    this.rightButton = this.add
      .sprite(this.width * 0.5, this.height, 'jump-rocket-button')
      .setOrigin(0, 1)
      .setDepth(10)
      .setScrollFactor(0)
      .setInteractive()
      .on('pointerdown', () => {
        this.handleRightInputDown();
        this.rightButton.setTint(0x999999);
      })
      .on('pointerup', () => {
        this.handleRightInputUp();
        this.rightButton.setTint(0xffffff);
      });
  }

  setupCollisionHandlers() {
    this.physics.add.collider(this.player.sprite, this.platforms);

    this.physics.add.overlap(this.player.sprite, this.rocket.sprite, () => {
      if (this.player.sprite.body.blocked.down) {
        this.player.sprite.setVelocity(0);
        if (!this.player.finished) {
          this.player.finished = true;
          const totalTime = this.player.getTotalTime();
          if (this.solo) {
            this.player.respawn(this.spawnPoint);
            const seconds = Math.floor(totalTime / 10) / 100;
            this.flashMessage(`${seconds}s`);
          } else {
            this.connection.handlePlayerReachGoal(totalTime);
          }
        }
      }
    });

    this.physics.add.overlap(
      this.player.sprite,
      this.blackHoles,
      (playerSprite, blackHole) => {
        if (this.player.inBlackHole) return;
        this.player.inBlackHole = true;
        this.player.fail();
        this.player.shrinkTo(blackHole.x, blackHole.y);
        this.connection.handlePlayerHitBlackHole(blackHole.x, blackHole.y);

        this.player.spinOnce();

        this.add.tween({
          targets: blackHole,
          scale: 2,
          duration: 100,
          yoyo: true,
        });
      }
    );

    this.physics.add.overlap(
      this.player.sprite,
      this.fuelResupplies,
      (_, fuelResupply) => {
        if (fuelResupply.canSupplyFuel) {
          fuelResupply.canSupplyFuel = false;
          this.player.setMaxFuel();

          this.add.tween({
            targets: fuelResupply,
            scale: 0,
            duration: 200,
          });

          setTimeout(() => {
            this.add.tween({
              targets: fuelResupply,
              scale: 1,
              duration: 200,
              onComplete: () => {
                fuelResupply.canSupplyFuel = true;
              },
            });
          }, 4000);
        }
      }
    );
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

  handleReset() {
    if (this.player.spawning) return;
    this.player.respawn(this.spawnPoint);
  }

  decodeLevel(level) {
    level.tiles.forEach((row, gridY) => {
      row.forEach((value, gridX) => {
        const x = (gridX + 0.5) * GRID_SIZE;
        const y = -(gridY + 0.5) * GRID_SIZE;

        if (value === obstacleMap._) return;

        if (value === obstacleMap.r || value === obstacleMap.R) {
          const direction = value === obstacleMap.r ? -1 : 1;
          this.rocket = new Rocket(this, x, y, direction);
          return;
        }

        if (value === obstacleMap.s || value === obstacleMap.S) {
          const direction = value === obstacleMap.s ? -1 : 1;
          this.spawnPoint = { x, y, direction };
          return;
        }

        if (value === obstacleMap.b) {
          const blackHole = this.blackHoles.create(x, y, 'items', 2);
          this.add.tween({
            targets: blackHole,
            rotation: -Math.PI * 2,
            duration: Phaser.Math.FloatBetween(800, 1000),
            repeat: -1,
          });
          return;
        }

        if (value === obstacleMap.f) {
          const fuelResupply = this.fuelResupplies.create(x, y, 'items', 0);
          fuelResupply.body.checkCollision.up = false; // this will disable 'walking' on fuel tank
          fuelResupply.canSupplyFuel = true;

          this.add.tween({
            targets: fuelResupply,
            y: '-=6',
            duration: Phaser.Math.FloatBetween(200, 400),
            repeat: -1,
            yoyo: true,
          });
          return;
        }

        this.platforms.create(x, y, 'tiles', value).refreshBody();
      });
    });
  }

  update() {
    this.updateCamera();
    this.player.update();
    this.connection.emitUpdate();
    this.fuelBarGraphics.setScale(this.player.getRelativeFuel(), 1);
  }

  updateCamera() {
    if (this.player.finished || this.player.failed) return;
    const x = 0;
    const y = this.player.sprite.body.bottom - this.height * 0.6;

    this.cameras.main.setScroll(x, y);

    background.setPosition(0, this.player.sprite.body.bottom * 0.5);
  }
}
