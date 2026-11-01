// Turns a level's text map (see levels/level1.js) into a Phaser tile map with collisions,
// plus a list of things to place (player start, curses, items...) for the level scene.
import { TILE } from '../assets/tiles.js';

export const TILE_SIZE = 16;

// Join the sections left to right into one grid of characters
function joinSections(def) {
  const grid = Array.from({ length: def.rows }, () => '');
  const hints = [];
  for (const sec of def.sections) {
    const width = Math.max(...sec.map.map((r) => r.length));
    const startCol = grid[0].length;
    const top = def.rows - sec.map.length;   // sections are lined up at the bottom
    for (let r = 0; r < def.rows; r++) {
      const row = r >= top ? sec.map[r - top] : '';
      grid[r] += row.padEnd(width, '.');
    }
    for (const h of sec.hints || []) hints.push({ ...h, x: h.x + startCol });
  }
  return { grid, hints };
}

const SOLID = { '#': true, B: true, S: true };

export function buildLevel(scene, def) {
  const { grid, hints } = joinSections(def);
  const rows = grid.length, cols = grid[0].length;

  // Tile numbers for the tile map (-1 = empty), and the things to place
  const data = [];
  const things = [];
  for (let r = 0; r < rows; r++) {
    const line = [];
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      let tile = -1;
      if (ch === '#') tile = (r > 0 && grid[r - 1][c] === '#') ? TILE.GROUND : TILE.GROUND_TOP;
      else if (ch === 'B') tile = TILE.BRICK;
      else if (ch === 'S') tile = TILE.STONE;
      else if (ch === '=') tile = TILE.PLATFORM;
      else if (ch === '%') tile = TILE.FAKE_BRICK;
      else if (ch !== '.' && !SOLID[ch]) {
        // A thing: remember its tile; x = centre of the tile, bottom = bottom edge of the tile
        things.push({ type: ch, col: c, row: r, x: c * TILE_SIZE + TILE_SIZE / 2, bottom: (r + 1) * TILE_SIZE });
      }
      line.push(tile);
    }
    data.push(line);
  }

  const map = scene.make.tilemap({ data, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
  const tileset = map.addTilesetImage('tiles', 'tiles', TILE_SIZE, TILE_SIZE, 0, 0);
  const layer = map.createLayer(0, tileset, 0, 0);
  // Solid tiles block from every side. The fake brick blocks nothing.
  layer.setCollision([TILE.GROUND_TOP, TILE.GROUND, TILE.BRICK, TILE.STONE]);
  // Wooden platforms only block from above, so you can jump up through them
  const fakeTiles = [];
  layer.forEachTile((t) => {
    if (t.index === TILE.PLATFORM) t.setCollision(false, false, true, false);
    if (t.index === TILE.FAKE_BRICK) fakeTiles.push(t);
  });

  return {
    map, layer, fakeTiles, hints, things,
    width: cols * TILE_SIZE,
    height: rows * TILE_SIZE,
  };
}
