import Phaser from 'phaser';

import { characters } from './boot';
import { headlineStyle, headlineOffset } from './style';

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

    socket.emit('GET_ROOMS', rooms => {
      rooms.forEach((room, i) => {
        this.add
          .text(20, 130 + i * 55, `${room.name} (${room.players.length})`, {
            fontSize: 32,
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
      });
    });
  }
}
