import Phaser from 'phaser';

const PLAYER_VELOCITY = 120;
const PLAYER_JUMP_VELOCITY = 300;

let player;
let playerDirection = -1;
let turnToggleInputPressed = false;
let input;

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
    player = this.physics.add.sprite(700, 500, 'player').setSize(16, 48);
    player.setBounce(0.0);
    player.setCollideWorldBounds(true);

    input = this.input.keyboard.createCursorKeys();
  }

  update() {
    this.handleInput();
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
}
