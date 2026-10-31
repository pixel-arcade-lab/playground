// A villager, seen from the front, with two walking frames.
// Letters: h = hair (or head scarf), s = skin, c = shirt / dress, p = trousers, b = shoes.
// Recolour with makeKind(VILLAGER, { c: '#...', h: '#...' }) to get different people.
export const VILLAGER = {
  height: 3.2,      // metres (bigger than real life so you can spot people from the plane)
  frameTime: 0.28,
  palette: { h: '#3a2a1e', s: '#e8b98f', c: '#b8483a', p: '#3b4a6b', b: '#2a2018' },
  frames: [
    [
      '..hhhh..',
      '.hhhhhh.',
      '.hssssh.',
      '..ssss..',
      '...ss...',
      '.cccccc.',
      'cccccccc',
      'c.cccc.c',
      's.cccc.s',
      '..pppp..',
      '..p..p..',
      '..p..p..',
      '..b..b..',
    ],
    [
      '..hhhh..',
      '.hhhhhh.',
      '.hssssh.',
      '..ssss..',
      '...ss...',
      '.cccccc.',
      'cccccccc',
      'c.cccc.c',
      's.cccc.s',
      '..pppp..',
      '.pp..pp.',
      '.p....p.',
      '.b....b.',
    ],
  ],
};

// Colour sets for different villagers: shirts, hair, and a few with a red head scarf
export const VILLAGER_LOOKS = [
  { c: '#b8483a' },
  { c: '#3a6ea5', h: '#c9a46a' },
  { c: '#5d8a3a', h: '#1f1a17' },
  { c: '#d9c6a0', p: '#5a4632' },
  { c: '#7a3f8f', h: '#c0392b', p: '#7a3f8f' },   // scarf and long dress
  { c: '#2f2f3a', h: '#8a8a8a' },                 // grey-haired grandpa
  { c: '#e0a030', h: '#3a2a1e', p: '#e0a030' },   // yellow dress
];
