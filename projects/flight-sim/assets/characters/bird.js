// A flying bird, seen from the front: wings up, then wings down.
// Letter k = body colour. Use makeKind(BIRD, SEAGULL) for a white seagull.
export const BIRD = {
  height: 1.7,
  frameTime: 0.22,
  palette: { k: '#2b2530' },
  frames: [
    [
      'k.......k',
      '.k.....k.',
      '..k...k..',
      '...kkk...',
      '....k....',
    ],
    [
      '.........',
      '.........',
      '...kkk...',
      '.kk.k.kk.',
      'k.......k',
    ],
  ],
};

export const SEAGULL = { k: '#f4f2ee' };
