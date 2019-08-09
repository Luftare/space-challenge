import { s, S, r, R, _ } from './obstacleMap';

const tiles = [
  [_, S, _, _, _, _, _, _, 5, _],
  [_, 8, _, _, 8, _, _, 3, 5, _],
  [_, _, _, _, _, _, _, _, 5, _],
  [1, 1, 1, 1, 1, 1, 1, 1, 5, _],
  [3, _, _, _, _, _, _, _, _, _],
  [6, _, _, _, _, _, _, _, _, _],
  [7, 1, 2, 1, 2, 8, 2, _, _, _],
  [_, _, _, _, _, R, 6, _, _, _],
  [_, _, _, _, _, 8, 7, _, 1, 8],
  [_, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _],
  [_, 0, 0, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, 3, _, _, 1],
].reverse();

export default { tiles };