import io from 'socket.io-client';
import { characters } from './boot';

let socket;

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'login' });
  }

  create() {
    const { width, height } = this.game.scale;
    socket = io();
    window.globalContext.socket = socket;
    window.globalContext.character = characters[0];

    this.add
      .text(width * 0.5, 80, 'Select character', {
        fontSize: 30,
      })
      .setOrigin(0.5, 0.5);

    const characterMargin = 180;
    const charactersWidth = (characters.length - 1) * characterMargin;
    const charactersLeftStart = width * 0.5 - charactersWidth * 0.5;

    const characterOptions = [];

    characters.forEach((character, i) => {
      const x = charactersLeftStart + i * characterMargin;
      const characterOption = this.add.sprite(
        x,
        height * 0.5,
        `${character.name}-avatar`,
        0
      );
      characterOption.setInteractive().on('pointerdown', () => {
        window.globalContext.character = character;
        characterOptions.forEach(option => {
          option.setScale(0.5);
        });
        characterOption.setScale(1);
      });
      characterOptions[i] = characterOption;
    });

    characterOptions.forEach(option => option.setScale(0.5));
    characterOptions[0].setScale(1);

    const playButton = this.add
      .text(width * 0.5, height - 100, 'play', {
        fontSize: 60,
        color: 'yellow',
      })
      .setOrigin(0.5, 0.5)
      .setInteractive()
      .on('pointerdown', () => {
        socket.emit('LOGIN', {
          name: window.globalContext.name,
          characterIndex: characters.indexOf(window.globalContext.character),
        });
        playButton.setScale(0.0, 0.0);
      });

    socket.on('connect', () => {});

    socket.on('JOIN_GAME', ({ levelIndex }) => {
      this.scene.start('game', { levelIndex });
    });
  }

  update() {}
}
