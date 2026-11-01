// Ren, a first-year student at the sorcerer school (our own character): black spiky hair with a red streak,
// navy school uniform with gold buttons, red scarf, white-and-red sneakers. 16 x 24 pixels, facing right.
// Each frame is built from three parts (head, body, legs), so a new pose only needs the part that changes.
//
// Letters: h hair, r red streak, s skin, k eye, f scarf, u uniform, U uniform light, g gold button,
//          p trousers, b shoe, B shoe sole, w fist

export const PLAYER_PALETTE = {
  h: '#241c2c', r: '#d8343c', s: '#f1c49c', k: '#1a1420', f: '#c8323c',
  u: '#2c3568', U: '#3e4b92', g: '#e8c050', p: '#1f2544', b: '#e8e4e0', B: '#c8323c', w: '#f1c49c',
};

// ---------- Heads (8 rows) ----------
const HEAD = [
  '......h.h.h.....',
  '....hhhhhhhh....',
  '...hhhhhhhhrh...',
  '...hhhhhhhrrh...',
  '...hhhsssssss...',
  '...hhssssskss...',
  '....hssssssss...',
  '.....sssssss....',
];
const HEAD_BLINK = [...HEAD.slice(0, 5), '...hhssssssss...', ...HEAD.slice(6)];

// ---------- Bodies (8 rows) ----------
const BODY = [
  '....ffffffff....',
  '..ffuuuuuuuuf...',
  '.ff.uuuguuuu....',
  '....uuuuuuuu....',
  '...suuuguuuus...',
  '...suuuuuuuus...',
  '....uuuuuuuu....',
  '....pppppppp....',
];
const BODY_PUNCH = [          // arm straight out
  '....ffffffff....',
  '..ffuuuuuuuuf...',
  '.ff.uuuguuuuUUww',
  '....uuuuuuuuUUww',
  '...suuuguuuu....',
  '....uuuuuuuu....',
  '....uuuuuuuu....',
  '....pppppppp....',
];
const BODY_UPPER = [          // uppercut, fist high
  '....ffffffff.ww.',
  '..ffuuuuuuuuUww.',
  '.ff.uuuguuuUU...',
  '....uuuuuuuu....',
  '...suuuguuuu....',
  '....uuuuuuuu....',
  '....uuuuuuuu....',
  '....pppppppp....',
];
const BODY_HURT = [           // arms thrown up
  '.s..ffffffff..s.',
  '.suuuuuuuuuuuus.',
  '....uuuguuuu....',
  '....uuuuuuuu....',
  '....uuuguuuu....',
  '....uuuuuuuu....',
  '....uuuuuuuu....',
  '....pppppppp....',
];
const BODY_DASH = [           // leaning forward, scarf flying behind
  'fff.ffffffff....',
  '..ffuuuuuuuuf...',
  '....uuuguuuuus..',
  '....uuuuuuuuus..',
  '....uuuguuuu....',
  '....uuuuuuuu....',
  '....uuuuuuuu....',
  '....pppppppp....',
];

// ---------- Legs (8 rows) ----------
const LEGS_STAND = [
  '....ppp..ppp....',
  '....ppp..ppp....',
  '....ppp..ppp....',
  '....ppp..ppp....',
  '....pp....pp....',
  '....pp....pp....',
  '...bbb....bbbb..',
  '...BBB....BBBB..',
];
const LEGS_RUN_A = [          // long stride
  '....pppppp......',
  '....pppppp......',
  '...ppp..ppp.....',
  '..ppp....ppp....',
  '.ppp......ppp...',
  '.pp........pp...',
  'bbb........bbb..',
  'BBB........BBB..',
];
const LEGS_RUN_B = [          // back leg lifting
  '....pppppp......',
  '....ppp.ppp.....',
  '....ppp..pp.....',
  '....ppp..ppbb...',
  '....ppp...BB....',
  '....ppp.........',
  '...bbbb.........',
  '...BBBB.........',
];
const LEGS_RUN_C = [          // front leg lifting
  '......pppppp....',
  '.....ppp.ppp....',
  '.....pp..ppp....',
  '...bbpp..ppp....',
  '....BB...ppp....',
  '.........ppp....',
  '.........bbbb...',
  '.........BBBB...',
];
const LEGS_JUMP = [
  '....pppppppp....',
  '....ppp..ppp....',
  '...ppp....ppp...',
  '...pp.....bbb...',
  '..bbb.....BBB...',
  '..BBB...........',
  '................',
  '................',
];
const LEGS_FALL = [
  '....ppp..ppp....',
  '....ppp..ppp....',
  '...ppp....ppp...',
  '...ppp....ppp...',
  '..bbb......bbb..',
  '..BBB......BBB..',
  '................',
  '................',
];
const LEGS_WIDE = [           // fighting stance
  '....ppp..ppp....',
  '...ppp....ppp...',
  '...ppp....ppp...',
  '..ppp......ppp..',
  '..pp........pp..',
  '..pp........pp..',
  '.bbb........bbbb',
  '.BBB........BBBB',
];

// ---------- Frames ----------
export const PLAYER_FRAMES = {
  idle: [...HEAD, ...BODY, ...LEGS_STAND],
  blink: [...HEAD_BLINK, ...BODY, ...LEGS_STAND],
  runA: [...HEAD, ...BODY, ...LEGS_RUN_A],
  runB: [...HEAD, ...BODY, ...LEGS_RUN_B],
  runC: [...HEAD, ...BODY, ...LEGS_RUN_C],
  jump: [...HEAD, ...BODY, ...LEGS_JUMP],
  fall: [...HEAD, ...BODY, ...LEGS_FALL],
  punch1: [...HEAD, ...BODY_PUNCH, ...LEGS_WIDE],
  punch2: [...HEAD, ...BODY_UPPER, ...LEGS_WIDE],
  punch3: [...HEAD, ...BODY_PUNCH, ...LEGS_RUN_A],
  dash: [...HEAD, ...BODY_DASH, ...LEGS_RUN_A],
  hurt: [...HEAD_BLINK, ...BODY_HURT, ...LEGS_FALL],
};

// Animations: name → list of frames (texture keys are "player_" + frame name), speed, and whether it loops
export const PLAYER_ANIMS = {
  idle: { frames: ['idle', 'idle', 'idle', 'idle', 'idle', 'blink'], fps: 4, loop: true },
  run: { frames: ['runA', 'runB', 'runA', 'runC'], fps: 11, loop: true },
  jump: { frames: ['jump'], fps: 1, loop: false },
  fall: { frames: ['fall'], fps: 1, loop: false },
  punch1: { frames: ['punch1'], fps: 1, loop: false },
  punch2: { frames: ['punch2'], fps: 1, loop: false },
  punch3: { frames: ['punch3'], fps: 1, loop: false },
  dash: { frames: ['dash'], fps: 1, loop: false },
  hurt: { frames: ['hurt'], fps: 1, loop: false },
};
