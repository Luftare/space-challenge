import io from 'socket.io-client';
import { characters } from './boot';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'login' });
  }

  create() {
    const { width, height } = this.game.scale;
    const socket = window.globalContext.socket || io();
    window.globalContext.socket = socket;
    window.globalContext.character = characters[0];

    this.add
      .text(width * 0.5, 80, 'Select character', {
        fontSize: 30,
      })
      .setOrigin(0.5, 0.5);

    const characterOffset = 160;
    const charactersWidth = (characters.length - 1) * characterOffset;
    const charactersLeftStart = width * 0.5 - charactersWidth * 0.5;

    const characterOptions = [];

    const characterGridColumns = Math.floor(Math.sqrt(characters.length));
    const characterGridWidth = (characterGridColumns - 1) * characterOffset;
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const topLeftCellX = centerX - 0.5 * characterGridWidth;
    const topLeftCellY = centerY - 0.5 * characterGridWidth;

    characters.forEach((character, i) => {
      const columns = 2;
      const indexX = i % columns;
      const indexY = Math.floor(i / columns);
      const x = topLeftCellX + indexX * characterOffset;
      const y = topLeftCellY + indexY * characterOffset;

      const characterOption = this.add.sprite(
        x,
        y,
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

    const buttonStyle = {
      fontSize: 40,
      color: 'yellow',
      backgroundColor: '#777777',
    };

    this.challengeButton = this.add
      .text(width * 0.33, height - 100, 'challenge', buttonStyle)
      .setOrigin(0.5, 0.5)
      .setInteractive()
      .on('pointerdown', () => {
        socket.on('START_GAME', ({ levelIndex }) => {
          this.scene.start('game', { levelIndex });
        });

        socket.emit('LOGIN', {
          name: window.globalContext.name,
          characterIndex: characters.indexOf(window.globalContext.character),
          score: window.globalContext.score,
        });

        this.challengeButton.setScale(0.0, 0.0);
      });

    this.add
      .text(width * 0.66, height - 100, 'solo', buttonStyle)
      .setOrigin(0.5, 0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('selectLevel');
      });
  }

  update() {}
}
