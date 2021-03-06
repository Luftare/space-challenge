import { s, S, r, R, f, b, _ } from './obstacleMap';

const tiles = [
  [_, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _],
  [R, _, _, _, f, _, _, _, _, _],
  [4, 3, 0, _, _, _, 0, 3, 4, 5],
  [4, _, _, _, _, _, _, _, _, 6],
  [_, _, _, _, f, _, _, _, _, 2],
  [6, _, _, _, _, _, _, _, _, 8],
  [7, S, _, _, _, 7, 5, 8, 4, 0],
  [0, 1, 2, 0, 6, _, _, _, _, _],
].reverse();

export default { tiles };
