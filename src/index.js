import Phaser from 'phaser';
import BootState from './states/boot';
import GameState from './states/game';

const gameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  pixelArt: true,
  title: 'Space dash',
  scene: [BootState, GameState],
};

function newGame() {
  if (game) return;
  game = new Phaser.Game(gameConfig);
}

function destroyGame() {
  if (!game) return;
  game.destroy(true);
  game.runDestroy();
  game = null;
}

let game;

if (module.hot) {
  module.hot.dispose(destroyGame);
  module.hot.accept(newGame);
}

if (!game) newGame();
