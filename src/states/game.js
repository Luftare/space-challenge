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
let leftButton;
let rightButton;
const bottomMargin = 80;

function requestPlayerJump(player) {
  const blocked = player.body.blocked;

  if (blocked.down && !blocked.up) {
    player.setVelocityY(-PLAYER_JUMP_VELOCITY);
  }
}

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
    const { width, height } = this.game.scale;

    playerSpawnPoint = {
      x: width - 16,
      y: height - 100 - bottomMargin,
    };

    player = this.physics.add.sprite(0, 0, 'player').setSize(16, 48);
    player.setBounce(0.0);
    player.setCollideWorldBounds(false);
    this.respawn();

    platforms = this.physics.add.staticGroup();

    tiles.forEach(([x, y]) => {
      platforms
        .create(x, height - y - bottomMargin, 'ground')
        .setScale(0.12, 0.12)
        .refreshBody();
    });

    const buttonStyle = {
      fontSize: '24px',
      backgroundColor: 'green',
      valign: 'center',
      halign: 'center',
      fixedWidth: width * 0.5,
      fixedHeight: bottomMargin,
      align: 'center',
    };

    leftButton = this.add.text(0, height - bottomMargin, 'käänny', buttonStyle);
    rightButton = this.add.text(width * 0.5, height - bottomMargin, 'hyppää', {
      ...buttonStyle,
      backgroundColor: 'red',
    });

    leftButton.setInteractive().on('pointerdown', () => {
      playerDirection *= -1;
    });

    rightButton.setInteractive().on('pointerdown', () => {
      requestPlayerJump(player);
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

    if (input.up.isDown) {
      requestPlayerJump(player);
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
