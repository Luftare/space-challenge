import Phaser from 'phaser';
import BootState, { characters } from './states/boot';
import GameState from './states/game';
import ScoreState from './states/score';
import LoginState from './states/login';
import { isMobileDevice } from './utils';

const levelEditMode = process.env.NODE_ENV === 'level_edit';
const PLAYER_NAME_KEY = 'space-dash-name';

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

function validateName(name) {
  return name.length > 1 && name.length < 14;
}

document.getElementById('name').addEventListener('input', e => {
  const validName = validateName(e.target.value);
  document.getElementById('submit').disabled = !validName;
});

document.getElementById('submit').addEventListener('click', () => {
  const name = document.getElementById('name').value;
  const validName = validateName(name);

  if (validName) {
    if (window.localStorage) {
      localStorage.setItem(PLAYER_NAME_KEY, name);
    }
    window.globalContext = {
      levelEditMode,
      socket: null,
      name,
      character: {},
      score: 0,
    };
    document.getElementById('login').style.display = 'none';
    document.getElementById('game-root').hidden = false;

    setTimeout(() => {
      if (!game && shouldCreateGame) newGame();
    }, 500);
  }
});

if (levelEditMode) {
  document.getElementById('login').style.display = 'none';
  document.getElementById('game-root').hidden = false;

  window.globalContext = {
    levelEditMode,
    socket: {
      on: () => {},
      emit: () => {},
      removeAllListeners: () => {},
    },
    name: 'tester',
    character: characters[0],
  };
  newGame();
}

if (window.localStorage) {
  const name = localStorage.getItem(PLAYER_NAME_KEY) || '';
  document.getElementById('name').value = name;
  document.getElementById('submit').disabled = false;
}
