// Level 1: School grounds at night (the tutorial level).
//
// The level is drawn as text, one character per 16 x 16 tile. It is split into sections that are
// joined left to right; each section lists its rows from the top, and is lined up at the bottom
// (missing rows at the top are empty sky). Short rows are filled with empty space on the right.
//
// Tiles:    #  ground       B  brick wall       S  stone block
//           =  wooden platform (jump up through it)        %  fake wall (looks like brick, walk through it)
// Things:   @  player start   c  crawler curse   f  flying curse   T  talisman   H  heart
//           P  checkpoint lantern   E  exit gate   ^  spikes   L  street lamp
// Hints:    { x, y, text } in tiles, measured inside the section (y from the top of the level)

export const LEVEL1 = {
  name: 'School Grounds at Night',
  rows: 18,
  sections: [
    // A: start. Walk and jump.
    {
      map: [
        '..........................T.....',
        '................................',
        '................................',
        '................................',
        '...@......L.........############',
        '################################',
        '################################',
        '################################',
        '################################',
      ],
      hints: [
        { x: 1, y: 10, text: 'Arrow keys or A / D: move' },
        { x: 13, y: 10, text: 'Space: jump' },
      ],
    },
    // B: gaps and wooden platforms
    {
      map: [
        '.................T................',
        '...............====...............',
        '..................................',
        '......................====........',
        '...........====...................',
        '..................................',
        '######............................',
        '######...########....#############',
        '######...########....#############',
        '######...########....#############',
        '######...########....#############',
      ],
      hints: [
        { x: 7, y: 8, text: 'Hold Space to jump higher' },
      ],
    },
    // C: first curses, first checkpoint
    {
      map: [
        '............S...................',
        '........c...S.......c.......P...',
        '################################',
        '################################',
        '################################',
        '################################',
      ],
      hints: [
        { x: 1, y: 9, text: 'Z: punch. Press it 3 times for a combo' },
      ],
    },
    // D: the old school building. Spikes below, flying curses inside, a secret room on the right.
    {
      map: [
        '........BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
        '........B.........................B....B',
        '........B.........................B....B',
        '...............f........f.........%....B',
        '....................H.............%..T.B',
        '........BBBBBBBBBBBBBBBBB..BBBBBBBBBBBBB',
        '........................................',
        '....====................................',
        '........................................',
        '..............^^^^^^....................',
        '########################################',
        '########################################',
        '########################################',
        '########################################',
      ],
      hints: [
        { x: 0, y: 8, text: 'Climb up! X: delayed punch (uses cursed energy)' },
      ],
    },
    // E: second checkpoint, and a gap too wide to jump: dash across
    {
      map: [
        '................T...................',
        '....................................',
        '....................................',
        '..P.....c.................c.........',
        '#############......#################',
        '#############......#################',
        '#############......#################',
        '#############......#################',
      ],
      hints: [
        { x: 3, y: 9, text: 'Too far to jump? Jump, then press C to dash' },
      ],
    },
    // F: last stretch and the exit gate
    {
      map: [
        '.........................f..............',
        '..................T.....................',
        '................======..................',
        '........................................',
        '............SS..........................',
        '......c...SSSS........c.............E...',
        '########################################',
        '########################################',
        '########################################',
        '########################################',
      ],
      hints: [
        { x: 0, y: 7, text: 'Black Flash: after 2 hits, punch again when your fist sparks red!' },
        { x: 0, y: 6, text: 'It hits every curse nearby and puts you in the Zone (stronger punches)' },
      ],
    },
  ],
};
