import Phaser from 'phaser';

import { characters } from './boot';
import {
  headlineStyle,
  headlineOffset,
  cornerOffset,
  smallButtonStyle,
} from './style';

let socket;

export default class SelectRoom extends Phaser.Scene {
  constructor() {
    super({
      key: 'selectRoom',
    });
  }

  init(data) {
    socket = window.globalContext.socket;
    socket.removeAllListeners();
  }

  create() {
    const { width, height } = this.game.scale;

    this.add
      .text(width * 0.5, 50, 'Select room', {
        fontSize: 40,
      })
      .setOrigin(0.5, 0.5);

    this.add
      .text(cornerOffset.x, cornerOffset.y, 'back', smallButtonStyle)
      .setOrigin(0.5, 0.5)
      .setScrollFactor(0)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('login');
      });

    socket.emit('GET_ROOMS', rooms => {
      rooms.forEach((room, i) => {
        this.add
          .text(cornerOffset.x, 130 + i * 70, `${room.name}`, {
            fontSize: 32,
            color: 'yellow',
          })
          .setOrigin(0, 0.5)
          .setInteractive()
          .on('pointerdown', () => {
            socket.on('START_GAME', ({ levelIndex }) => {
              this.scene.start('game', { levelIndex });
            });

            socket.emit('LOGIN', {
              name: window.globalContext.name,
              roomName: room.name,
              characterIndex: characters.indexOf(
                window.globalContext.character
              ),
              score: window.globalContext.score,
            });
          });

        this.add
          .text(
            cornerOffset.x,
            160 + i * 70,
            `${room.levels.length} level${room.levels.length > 1 ? 's' : ''}, ${
              room.players.length
            } online`,
            {
              fontSize: 16,
            }
          )
          .setOrigin(0, 0.5);
      });
    });
  }
}
