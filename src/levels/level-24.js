import { s, S, r, R, b, f, _ } from './obstacleMap';

const tiles = [
  [8, 0, 1, 2, 3, 4, 7, 5, 7, 8],
  [6, _, _, _, _, _, _, _, _, 6],
  [4, _, _, _, _, _, _, _, _, 3],
  [2, S, _, _, _, _, _, _, r, 5],
  [0, 1, 3, 2, _, _, 2, 1, 3, 2],
].reverse();

export default { tiles };
