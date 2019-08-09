import Phaser from 'phaser';
import BootState from './states/boot';
import GameState from './states/game';
import ScoreState from './states/score';
import LoginState from './states/login';
import { isMobileDevice } from './utils';

const mobile = isMobileDevice();

let game;

const gameConfig = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: 'game-root',
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 600,
    height: 800,
  },
  pixelArt: true,
  title: 'Space dash',
  scene: [BootState, LoginState, GameState, ScoreState],
};

function newGame() {
  if (game) return;

  if (mobile) {
    const screenAspectRatio = window.innerWidth / window.innerHeight;
    gameConfig.scale.height = gameConfig.scale.width / screenAspectRatio;
  }
  game = new Phaser.Game(gameConfig);
}

const handleResize = () => {
  if (!mobile) return;
  const landscapeOrientation = window.innerWidth > window.innerHeight;

  if (landscapeOrientation) {
    document.querySelector('#game-root').style.display = 'none';
    document.querySelector('#rotate-device').style.display = 'flex';
  } else {
    document.querySelector('#game-root').style.display = 'block';
    document.querySelector('#rotate-device').style.display = 'none';
  }

  if (!game && !landscapeOrientation) {
    newGame();
  }
};

window.addEventListener('resize', handleResize);

function destroyGame() {
  if (!game) return;
  game.destroy(true);
  game.runDestroy();
  game = null;
}

if (module.hot) {
  module.hot.dispose(destroyGame);
  module.hot.accept(newGame);
}

const shouldCreateGame =
  !mobile || (mobile && window.innerWidth < window.innerHeight);

document.getElementById('set-name-submit').addEventListener('click', () => {
  const name = document.getElementById('name').value;
  const validName = name.length > 1 && name.length < 10;

  if (validName) {
    window.globalContext = {
      socket: null,
      name,
      character: {},
    };
    document.getElementById('set-name').style.display = 'none';
    document.getElementById('game-root').hidden = false;
    if (!game && shouldCreateGame) newGame();
  }
});
