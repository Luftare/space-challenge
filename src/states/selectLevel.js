import levels from '../levels';
import {
  smallButtonStyle,
  cornerOffset,
  headlineOffset,
  headlineStyle,
} from './style';

export default class SelectLevel extends Phaser.Scene {
  constructor() {
    super({ key: 'selectLevel' });
  }

  create() {
    const { width, height } = this.game.scale;

    this.add
      .text(width * 0.5, headlineOffset.y, 'Select level', headlineStyle)
      .setOrigin(0.5, 0.5);

    const levelOffset = 80;
    const gridColumns = 5;
    const gridWidth = (gridColumns - 1) * levelOffset;
    const gridLeftStart = width * 0.5 - gridWidth * 0.5;

    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const topLeftCellX = centerX - 0.5 * gridWidth;
    const topLeftCellY = centerY - 0.5 * gridWidth;

    levels.forEach((level, i) => {
      const indexX = i % gridColumns;
      const indexY = Math.floor(i / gridColumns);
      const x = topLeftCellX + indexX * levelOffset;
      const y = topLeftCellY + indexY * levelOffset;

      const levelOption = this.add
        .text(x, y, i + 1, {
          fontSize: 26,
          padding: 16,
          color: 'yellow',
          backgroundColor: '#777777',
        })
        .setOrigin(0.5, 0.5);

      levelOption.setInteractive().on('pointerdown', () => {
        this.scene.start('game', { levelIndex: i, solo: true });
      });
    });

    this.add
      .text(cornerOffset.x, cornerOffset.y, 'menu', smallButtonStyle)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('login');
      });
  }

  update() {}
}
