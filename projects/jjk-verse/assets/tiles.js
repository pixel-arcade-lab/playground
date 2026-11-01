// The level tiles, 16 x 16 pixels each. Their order in TILES is their number in the tile map (see TILE).
// Letters (one shared palette): G/g grass, d/D soil, s soil speck, B/b brick, m mortar, K crack,
//                               W/w/k wood, o/S/x/z stone

export const TILE_PALETTE = {
  G: '#4f7a42', g: '#355a32', d: '#3a2a2c', D: '#4a3634', s: '#2a1c20',
  B: '#6e5d80', b: '#5c4c6c', m: '#2e2538', K: '#1e1828',
  W: '#b08050', w: '#8a5e36', k: '#3a2216',
  o: '#2a2832', S: '#8a8698', x: '#6c687a', z: '#4a4658',
};

const SOIL = [
  'dddddsddddddDddd',
  'dDdddddddsdddddd',
  'ddddDdddddddddsd',
  'dsddddddDddddddd',
  'ddddddsdddddDddd',
  'dDddddddddddddds',
  'ddddsddddDdddddd',
  'dddddddDddddsddd',
  'dsdddddddddddddd',
  'dddDddddsdddDddd',
  'ddddddDddddddddd',
  'sddddddddddsdddd',
];

const GROUND_TOP = [
  'GGgGGGgGGGGgGGgG',
  'gGgggGgggGggggGg',
  'gggdggggdgggdggg',
  'ddDdddddDddddDdd',
  ...SOIL,
];
const GROUND = [...SOIL, ...SOIL.slice(0, 4)];

const BRICK_HALF = [
  'BBBBBBBmBBBBBBBm',
  'bbbbbbbmbbbbbbbm',
  'bbbbbbbmbbbbbbbm',
  'mmmmmmmmmmmmmmmm',
  'BBBmBBBBBBBmBBBB',
  'bbbmbbbbbbbmbbbb',
  'bbbmbbbbbbbmbbbb',
  'mmmmmmmmmmmmmmmm',
];
const BRICK = [...BRICK_HALF, ...BRICK_HALF];
// Looks like brick, but you can walk through it (secret passages). Two tiny cracks give it away.
const FAKE_BRICK = [
  'BBBBBBBmBBBBBBBm',
  'bbbbKbbmbbbbbbbm',
  'bbbbbKbmbbbbbbbm',
  'mmmmmmmmmmmmmmmm',
  'BBBmBBBBBBBmBBBB',
  'bbbmbbbbbbbmbbbb',
  'bbbmbbbbbbbmbbbb',
  'mmmmmmmmmmmmmmmm',
  'BBBBBBBmBBBBBBBm',
  'bbbbbbbmbbbbKbbm',
  'bbbbbbbmbbbKbbbm',
  'mmmmmmmmmmmmmmmm',
  'BBBmBBBBBBBmBBBB',
  'bbbmbbbbbbbmbbbb',
  'bbbmbbbbbbbmbbbb',
  'mmmmmmmmmmmmmmmm',
];
// Wooden platform: you can jump up through it from below and stand on it
const PLATFORM = [
  'kkkkkkkkkkkkkkkk',
  'WWWWWWWWWWWWWWWW',
  'wwwwwwkwwwwwwwkw',
  'wwwwwwkwwwwwwwkw',
  'kkkkkkkkkkkkkkkk',
  '.k............k.',
  '.k............k.',
  ...Array(9).fill('................'),
];
const STONE = [
  'oooooooooooooooo',
  'oSSSSSSSSSSSSSxo',
  ...Array(12).fill('oSxxxxxxxxxxxxzo'),
  'oxzzzzzzzzzzzzzo',
  'oooooooooooooooo',
];

export const TILES = [GROUND_TOP, GROUND, BRICK, PLATFORM, STONE, FAKE_BRICK];
export const TILE = { GROUND_TOP: 0, GROUND: 1, BRICK: 2, PLATFORM: 3, STONE: 4, FAKE_BRICK: 5 };
