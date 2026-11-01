// Items and level objects: talisman (collectible), heart, spikes, stone lantern (checkpoint),
// torii gate (level exit), street lamp, and small effect pictures.

// Talisman: a paper charm with a red seal. Collect them all in each level. 8 x 12.
export const TALISMAN = {
  palette: { k: '#3a2a1a', p: '#efe3c0', r: '#c8323c' },
  rows: [
    'kkkkkkkk',
    'kppppppk',
    'kprrrrpk',
    'kpprrppk',
    'kprrrrpk',
    'kpprrppk',
    'kprpprpk',
    'kprrrrpk',
    'kppppppk',
    'kpprrppk',
    'kppppppk',
    'kkkkkkkk',
  ],
};

// Heart: full (pick-up and HUD) and empty (HUD). 8 x 8.
const HEART_ROWS = [
  '.rr..rr.',
  'rRrrrrrr',
  'rRrrrrrr',
  'rrrrrrrr',
  '.rrrrrr.',
  '..rrrr..',
  '...rr...',
  '........',
];
export const HEART = { palette: { r: '#e8384f', R: '#ff9aa8' }, rows: HEART_ROWS };
export const HEART_EMPTY = { palette: { r: '#3a2838', R: '#4a3848' }, rows: HEART_ROWS };

// Spikes: 16 x 8, sit on the floor
export const SPIKES = {
  palette: { g: '#b7aec7', d: '#5a5068', w: '#e8e2f0' },
  rows: [
    '..w...w...w...w.',
    '..g...g...g...g.',
    '.ggg.ggg.ggg.ggg',
    '.ggg.ggg.ggg.ggg',
    'gggggggggggggggg',
    'ddgggddgggddgggd',
    'dddddddddddddddd',
    'dddddddddddddddd',
  ],
};

// Stone lantern (checkpoint): dark when unused, lit after you touch it. 12 x 20.
const LANTERN_ROWS = [
  '....ssss....',
  '...ssssss...',
  '..ssssssss..',
  '....ssss....',
  '...sffffs...',
  '...sfFFfs...',
  '...sfFFfs...',
  '...sffffs...',
  '..ssssssss..',
  '....ssss....',
  '....ssss....',
  '....ssss....',
  '...ssssss...',
  '...ssssss...',
  '..ssssssss..',
  '..ssssssss..',
  '.ssssssssss.',
  '.ssssssssss.',
  'ssssssssssss',
  'ssssssssssss',
];
export const LANTERN_OFF = { palette: { s: '#7d7a8c', f: '#2e2838', F: '#3a3346' }, rows: LANTERN_ROWS };
export const LANTERN_ON = { palette: { s: '#8d8a9c', f: '#ff9a3a', F: '#fff0a0' }, rows: LANTERN_ROWS };

// Torii gate (level exit). 32 x 40.
const toriiRows = () => {
  const rows = [
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'krrrrrrrrrrrrrrrrrrrrrrrrrrrrrrk',
    '.krrrrrrrrrrrrrrrrrrrrrrrrrrrrk.',
    '..kkkkkkkkkkkkkkkkkkkkkkkkkkkk..',
    '.....rrr......dddd......rrr.....',
    '.....rrr......dddd......rrr.....',
    '...rrrrrrrrrrrrrrrrrrrrrrrrrr...',
    '...dddddddddddddddddddddddddd...',
  ];
  for (let i = 0; i < 30; i++) rows.push('.....rrd................rrd.....');
  rows.push('....kkkkk..............kkkkk....', '....kkkkk..............kkkkk....');
  return rows;
};
export const TORII = { palette: { r: '#c8323c', d: '#7a1a22', k: '#2a0c10' }, rows: toriiRows() };

// Street lamp (background decoration). 8 x 32.
const lampRows = () => {
  const rows = ['..kkkk..', '.kyyyyk.', '.kyYYyk.', '.kyyyyk.', '..kkkk..'];
  for (let i = 0; i < 25; i++) rows.push('...kk...');
  rows.push('..kkkk..', '.kkkkkk.');
  return rows;
};
export const LAMP = { palette: { k: '#2a2a35', y: '#ffd27a', Y: '#fff2c0' }, rows: lampRows() };

// A small white-yellow spark (punch hits). 8 x 8.
export const SPARK = {
  palette: { w: '#ffffff', y: '#ffe27a' },
  rows: [
    '...w....',
    '...w....',
    '..wyw...',
    'wwyyyww.',
    '..wyw...',
    '...w....',
    '...w....',
    '........',
  ],
};

// The Black Flash cue: a red-and-black star on the fist, meaning "punch NOW". 9 x 9.
export const CUE = {
  palette: { k: '#120008', r: '#ff2a3a', w: '#ffffff' },
  rows: [
    '....r....',
    '...rkr...',
    '...rkr...',
    '.rrkwkrr.',
    'rkkwwwkkr',
    '.rrkwkrr.',
    '...rkr...',
    '...rkr...',
    '....r....',
  ],
};
