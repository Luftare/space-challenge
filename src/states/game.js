import Phaser from 'phaser';

const PLAYER_VELOCITY = 100;
const PLAYER_JUMP_VELOCITY = 300;

let player;
let playerDirection = -1;
let playerFailed = false;
let playerSpawnPoint;
let platforms;
let turnToggleInputPressed = false;
let input;

const tiles = [
  [300, 100],
  [350, 120],
  [400, 100],
  [500, 240],
  [550, 240],
  [600, 240],
  [450, 0],
  [500, 0],
  [550, 0],
  [600, 0],
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({
      key: 'game',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 300 },
          debug: false,
        },
      },
    });
  }

  create() {
    playerSpawnPoint = {
      x: this.game.scale.width - 50,
      y: this.game.scale.height - 50,
    };

    player = this.physics.add.sprite(0, 0, 'player').setSize(16, 48);
    player.setBounce(0.0);
    player.setCollideWorldBounds(false);

    this.respawn();

    platforms = this.physics.add.staticGroup();

    tiles.forEach(([x, y]) => {
      platforms
        .create(x, this.game.scale.height - y, 'ground')
        .setScale(0.12, 0.12)
        .refreshBody();
    });

    this.physics.add.collider(player, platforms);

    input = this.input.keyboard.createCursorKeys();
  }

  update() {
    if (!playerFailed) {
      this.handleInput();
      this.handleFailing();
    }
    window.player = player;
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

    if (input.up.isDown && blocked.down && !blocked.up) {
      player.setVelocityY(-PLAYER_JUMP_VELOCITY);
    }

    if (playerDirection === -1 && !blocked.left) {
      if (blocked.down) {
        player.setVelocityX(-PLAYER_VELOCITY);
      }
      player.play('player-walk-left', true);
    } else if (playerDirection === 1 && !blocked.right) {
      if (blocked.down) {
        player.setVelocityX(PLAYER_VELOCITY);
      }
      player.play('player-walk-right', true);
    } else {
      player.setVelocityX(0);
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
  }
}
