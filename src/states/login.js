import io from 'socket.io-client';

let socket;

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'login' });
  }

  preload() {
    socket = io();
    window.globalContext = {
      socket,
      name: 'Jeppe',
    };

    socket.on('connect', () => {});

    socket.on('NEW_GAME', ({ levelIndex }) => {
      this.scene.start('game', { levelIndex });
    });
  }

  update() {}
}
