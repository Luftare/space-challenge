import { s, S, r, R, b, f, _ } from './obstacleMap';

const tiles = [
  [_, _, _, _, _, _, _, b, _, _],
  [_, _, _, _, _, _, _, b, _, _],
  [_, _, _, b, _, _, _, _, _, _],
  [S, _, _, b, _, _, _, _, _, r],
  [0, 1, 3, 2, 4, 5, 2, 1, 3, 2],
].reverse();

export default { tiles };
