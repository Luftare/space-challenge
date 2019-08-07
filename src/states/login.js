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
      name,
    };

    socket.on('connect', () => {
      this.scene.start('game');
    });
  }

  update() {}
}
