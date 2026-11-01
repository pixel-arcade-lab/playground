// The cursed spirits (enemies). 16 x 12 pixels, two animation frames each.

// Crawler: a purple blob with one big red eye, many little legs. Walks along platforms.
// Letters: k outline, c body, C body light, e eye white, r eye red, t teeth
export const CRAWLER = {
  palette: { k: '#1a1020', c: '#5b3a6e', C: '#7a4f91', e: '#f2e8d0', r: '#d92d2d', t: '#c9b8d8' },
  fps: 6,
  frames: [
    [
      '....kkkkkkkk....',
      '...kccCCCccck...',
      '..kcccCCCcccck..',
      '.kcccceeeecccck.',
      '.kccceerreeccck.',
      '.kccceerreeccck.',
      '.kcccceeeecccck.',
      '.kcctttttttccck.',
      '..kccccccccccck.',
      '...k.k.k.k.k.k..',
      '..k.k...k.k.k...',
      '.k...k.k...k.k..',
    ],
    [
      '....kkkkkkkk....',
      '...kccCCCccck...',
      '..kcccCCCcccck..',
      '.kcccceeeecccck.',
      '.kccceerreeccck.',
      '.kccceerreeccck.',
      '.kcccceeeecccck.',
      '.kcctttttttccck.',
      '..kccccccccccck.',
      '...k.k.k.k.k.k..',
      '....k.k.k...k.k.',
      '...k...k.k.k...k',
    ],
  ],
};

// Flyer: a winged curse with two yellow eyes and a big red mouth. Floats and swoops at you.
// Letters: k outline, c body, C body light, w wings, e eyes, m mouth
export const FLYER = {
  palette: { k: '#1a1020', c: '#4a3f6b', C: '#6a5a96', w: '#9c8fc4', e: '#ffe27a', m: '#d92d2d' },
  fps: 8,
  frames: [
    [
      'w..............w',
      'ww............ww',
      'www..........www',
      '.wwwkkkkkkkkwww.',
      '...kcCCCCCCck...',
      '...kceecceeck...',
      '...kceecceeck...',
      '...kccccccccck..',
      '...kcmmmmmmcck..',
      '....kcmmmmcck...',
      '.....kkkkkkk....',
      '......k...k.....',
    ],
    [
      '................',
      '................',
      '................',
      '....kkkkkkkk....',
      '...kcCCCCCCck...',
      'wwwkceecceeckwww',
      'wwwkceecceeckwww',
      '.wwkccccccccckw.',
      '..wkcmmmmmmcckw.',
      '....kcmmmmcck...',
      '.....kkkkkkk....',
      '......k...k.....',
    ],
  ],
};
