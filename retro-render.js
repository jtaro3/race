// Retro presentation. Physics, mobile controls and the chip editor stay in game.js.
const retroSurface = document.createElement('canvas');
const retroContext = retroSurface.getContext('2d');
let retroPixels;
const RETRO_WIDTH = 384;
const RETRO_HEIGHT = 240;
const RETRO_HORIZON = 72;
const RETRO_FOCAL = 180;
let RETRO_CAMERA_HEIGHT = 80;
let retroGridVisible = false;
const RETRO_CAMERA_BACK = 120;

spriteCatalog.kart.legend = {
  O: '#202630', W: '#f7f0ce', D: '#427cc3', B: '#d84435',
  H: '#ffb779', R: '#9c272c', T: '#648b9a',
  S: '#26466f', E: '#ff8171', G: '#abc9d4', K: '#3c4654'
};
const rearKart = [
  '.....RRRRR.....', '....RBEEBBR....', '....BBBBBBR....',
  '.....HHHHH.....', '....RDDDDDS....', '...RDDDDDSSS...',
  '..OGDDDDDDSGO..', '.KOGWWWWWGGTKO.', '.KOREEBBBRRTKO.',
  '.OO.TTTTTTT.OO.', '.OO.GWWWWWG.OO.', '.....OOOOO.....'
];
const turningKart = [
  '.......RRRRR...', '......RBEEBBR..', '......BBBBBBR..',
  '.......HHHHH...', '.....RDDDDDR...', '....RDDDDDDR...',
  '..OGDDDDDSSTO..', '.KOGWWWWWGTTKO.', '.KOREEBBRRTTKO.',
  '.OO.TTTTTTT.OO.', '.OO.WWWWWWW.OO.', '.....OOOOO.....'
];
const sideKart = [
  '.......RRRRR...', '......RBBBBBR..', '......BBBBBBB..',
  '.......HHHHH...', '......RDDDDR...', '....TTDDDDDT...',
  '...TTTTTTTTTT..', '..OTWWWWWWWTTO.', '..OTBBBBBBBTTO.',
  '..OO.TTTTTT.OO.', '..OO.WWWWWW.OO.', '......OOOO.....'
];
const frontKart = [
  '.....RRRRR.....', '....RBBBBBR....', '....BBBBBBB....',
  '.....HOOOH.....', '....HHHHHHH....', '...RDDDDDDDR...',
  '..OTDDDDDDDTO..', '.OOTWWWWWWWTTO.', '.OOTBBBBBBBTTO.',
  '.OO.TTTTTTT.OO.', '.OO.WWWWWWW.OO.', '.....OOOOO.....'
];
spriteCatalog.kart.frames = {
  rear: rearKart, 'rear-left': turningKart,
  'rear-right': turningKart.map(row => [...row].reverse().join('')),
  side: sideKart, front: frontKart
};
spriteCatalog.tree = {
  legend: { O: '#185827', L: '#29992c', H: '#62c83b', T: '#86522a', S: '#57371f', G: '#bbdf68' },
  pixels: ['....HHHH....', '..HHGGHHLH..', '.HHHHLLLLLO.', 'HHHLLLLLLLOO',
    'HLLLLLLLLLOO', '.LLLLLLLLOO.', '..OOOOOOOO..', '.....TS.....', '.....TS.....', '....TTSS....']
};

function retroCamera() {
  const back = RETRO_CAMERA_BACK * RETRO_CAMERA_HEIGHT / 80;
  return {
    x: camera.x - Math.sin(camera.angle) * back,
    y: camera.y + Math.cos(camera.angle) * back
  };
}

cameraPoint = function (x, y, width, height) {
  const origin = retroCamera();
  const dx = x - origin.x, dy = y - origin.y;
  const sin = Math.sin(camera.angle), cos = Math.cos(camera.angle);
  const depth = dx * sin - dy * cos;
  if (depth < 24 || depth > 3600) return null;
  const side = dx * cos + dy * sin;
  const scale = RETRO_FOCAL / depth;
  return {
    x: width / 2 + side * scale * width / RETRO_WIDTH,
    y: (RETRO_HORIZON + RETRO_CAMERA_HEIGHT * scale) * height / RETRO_HEIGHT,
    depth, scale: scale * height / RETRO_HEIGHT
  };
};

function renderRetroFloor(width, height) {
  if (!retroPixels) {
    retroSurface.width = RETRO_WIDTH;
    retroSurface.height = RETRO_HEIGHT;
    retroPixels = retroContext.createImageData(RETRO_WIDTH, RETRO_HEIGHT);
  }
  const pixels = retroPixels.data;
  const origin = retroCamera();
  const sin = Math.sin(camera.angle), cos = Math.cos(camera.angle);
  for (let row = RETRO_HORIZON; row < RETRO_HEIGHT; row++) {
    const depth = RETRO_CAMERA_HEIGHT * RETRO_FOCAL / (row - RETRO_HORIZON + 1);
    const step = depth / RETRO_FOCAL;
    let worldX = origin.x + sin * depth - cos * RETRO_WIDTH / 2 * step;
    let worldY = origin.y - cos * depth - sin * RETRO_WIDTH / 2 * step;
    for (let col = 0; col < RETRO_WIDTH; col++) {
      const cell = cellFromWorld(worldX, worldY);
      const outside = cell.col < 0 || cell.row < 0 || cell.col >= courseMap.cols || cell.row >= courseMap.rows;
      const tile = outside ? 'grass' : tileAtWorld(worldX, worldY);
      const hash = ((Math.floor(worldX / 9) * 37) ^ (Math.floor(worldY / 9) * 61)) & 15;
      let red, green, blue;
      if (tile === 'asphalt') {
        red = 102 + (hash & 1); green = 103 + (hash & 1); blue = 108 + (hash & 1);
      } else if (tile === 'sand') {
        red = 223; green = 192 + (hash & 7); blue = 112;
      } else if (tile === 'wall') {
        // Continuous painted curbs share the exact wall tile footprint.
        const stripe = (Math.floor(worldX / 80) + Math.floor(worldY / 80)) & 1;
        red = stripe ? 236 : 198; green = stripe ? 233 : 45; blue = stripe ? 213 : 42;
      } else {
        red = hash < 3 ? 111 : 37; green = hash < 3 ? 188 : 139 + hash * 3; blue = 32;
      }
      // World-aligned grid: stays attached to the ground while driving/turning.
      if (retroGridVisible && !outside) {
        const gridX = ((worldX - courseMap.originX) % courseMap.size + courseMap.size) % courseMap.size;
        const gridY = ((worldY - courseMap.originY) % courseMap.size + courseMap.size) % courseMap.size;
        const lineWidth = Math.min(4, Math.max(1.5, step * .65));
        if (gridX < lineWidth || gridY < lineWidth) {
          red = Math.round(red * .55 + 110);
          green = Math.round(green * .55 + 110);
          blue = Math.round(blue * .55 + 110);
        }
      }
      const index = (row * RETRO_WIDTH + col) * 4;
      pixels[index] = red; pixels[index + 1] = green;
      pixels[index + 2] = blue; pixels[index + 3] = 255;
      worldX += cos * step; worldY += sin * step;
    }
  }
  retroContext.putImageData(retroPixels, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(retroSurface, 0, 0, width, height);
}
scenery.forEach(tree => { tree.color = '#36a337'; });
visualDesign.palette.grassTiles = ['#38a633', '#52b834', '#32a02e', '#68bd39'];

document.querySelector('.version').textContent = 'v4.2.0-solid-objects';
document.querySelector('#gridToggle').addEventListener('change', event => {
  retroGridVisible = event.target.checked;
});
document.querySelector('#cameraHeight').addEventListener('input', event => {
  RETRO_CAMERA_HEIGHT = clamp(Number(event.target.value), 45, 110);
  document.querySelector('#cameraHeightValue').textContent = RETRO_CAMERA_HEIGHT;
});
document.querySelector('.brand > span:nth-child(2)').textContent = 'RETRO KART';
// CSS loads after game.js; keep the backing bitmap in sync with layout changes.
new ResizeObserver(resize).observe(canvas);

// Extruded chip walls: all faces use the same world-space footprint as collision.
function renderRetroWalls(width, height) {
  const faces = [];
  const origin = retroCamera(), sin = Math.sin(camera.angle), cos = Math.cos(camera.angle);
  const point = (x, y, z) => {
    const dx = x - origin.x, dy = y - origin.y;
    return { side: dx * cos + dy * sin, depth: dx * sin - dy * cos, z };
  };
  const addFace = (vertices, color) => {
    // Clip at the near plane instead of dropping whole walls beside the camera.
    const clipped = [];
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i], b = vertices[(i + 1) % vertices.length];
      if (a.depth >= 24) clipped.push(a);
      if ((a.depth >= 24) !== (b.depth >= 24)) {
        const t = (24 - a.depth) / (b.depth - a.depth);
        clipped.push({ depth: 24, side: a.side + (b.side - a.side) * t, z: a.z + (b.z - a.z) * t });
      }
    }
    if (clipped.length >= 3) faces.push({ vertices: clipped, color,
      depth: vertices.reduce((sum, p) => sum + p.depth, 0) / vertices.length });
  };
  for (let row = 0; row < courseMap.rows; row++) {
    for (let col = 0; col < courseMap.cols; col++) {
      if (courseMap.cells[row][col] !== 'wall') continue;
      const left = courseMap.originX + col * courseMap.size + 12;
      const top = courseMap.originY + row * courseMap.size + 12;
      const size = courseMap.size - 24;
      const corners = [[left, top], [left + size, top], [left + size, top + size], [left, top + size]];
      const bottom = corners.map(([x,y]) => point(x,y,0));
      const upper = corners.map(([x,y]) => point(x,y,32));
      if (bottom.every(p => p.depth < 24 || p.depth > 3600)) continue;
      const white = (col + row) % 2;
      addFace(upper, white ? '#fff0d5' : '#ff8270');
      for (let edge = 0; edge < 4; edge++) {
        const next = (edge + 1) % 4;
        const shades = white ? ['#c9c0a6', '#a49c89', '#e1d9be', '#b6ad98'] : ['#c43b35', '#8e292c', '#e34e40', '#ac302f'];
        addFace([bottom[edge], bottom[next], upper[next], upper[edge]], shades[edge]);
      }
    }
  }
  faces.sort((a, b) => b.depth - a.depth);
  for (const face of faces) {
    ctx.beginPath();
    face.vertices.forEach((p, i) => {
      const scale = RETRO_FOCAL / p.depth;
      const x = width / 2 + p.side * scale * width / RETRO_WIDTH;
      const y = (RETRO_HORIZON + (RETRO_CAMERA_HEIGHT - p.z) * scale) * height / RETRO_HEIGHT;
      if (i) ctx.lineTo(x,y); else ctx.moveTo(x,y);
    });
    ctx.closePath(); ctx.fillStyle = face.color; ctx.fill();
  }
}

function renderRetroSky(width, height) {
  const horizon = height * RETRO_HORIZON / RETRO_HEIGHT;
  ctx.fillStyle = '#80c7f3';
  ctx.fillRect(0, 0, width, horizon + 2);
  const drift = camera.angle * width / 3;
  for (let i = -2; i < 8; i++) {
    const x = ((i * width / 3 - drift) % (width * 2) + width * 2) % (width * 2) - width / 2;
    ctx.fillStyle = '#f8fcff';
    ctx.fillRect(x, horizon * .3, width * .11, horizon * .15);
    ctx.fillRect(x + width * .025, horizon * .22, width * .06, horizon * .12);
    ctx.fillStyle = '#398f39';
    ctx.beginPath();
    ctx.ellipse(x, horizon + 5, width * .16, horizon * .35, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  }
}

drawKart = function (x, y, size, color, hero, tilt = 0, frame = 'rear') {
  const unit = size / 15;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#28332999';
  ctx.beginPath();
  ctx.ellipse(0, -unit, size * .43, size * .085, 0, 0, Math.PI * 2);
  ctx.fill();
  if (hero && player.boost > 0) {
    ctx.fillStyle = '#f14727';
    ctx.fillRect(-unit * 2, 0, unit * 4, unit * 3);
  }
  const relativeAngle = hero ? angleDiff(player.angle, camera.angle) : 0;
  const steering = hero ? player.steer : 0;
  if (hero) frame = Math.abs(relativeAngle) > .12 || Math.abs(steering) > .2
    ? (steering > 0 || relativeAngle > .12 ? 'rear-right' : 'rear-left') : 'rear';
  drawPixelSprite({ pixels: spriteCatalog.kart.frames[frame] || rearKart, legend: spriteCatalog.kart.legend }, 0, 0, unit,
    { B: hero ? '#d84435' : color });
  // Wheel rims and a shaded bumper add volume without changing ground contact.
  ctx.fillStyle = '#748394';
  ctx.fillRect(-unit * 5.8, -unit * 3, unit, unit * 1.5);
  ctx.fillRect(unit * 4.8, -unit * 3, unit, unit * 1.5);
  ctx.fillStyle = '#192330';
  ctx.fillRect(-unit * 3.5, -unit * 1.8, unit * 7, unit * .8);
  ctx.fillStyle = '#d2e6ec';
  ctx.fillRect(-unit * 3.5, -unit * 2.2, unit * 7, unit * .45);
  ctx.restore();
};

renderRaceView = function (width, height) {
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, width, height); ctx.clip();
  renderRetroSky(width, height);
  renderRetroFloor(width, height);
  renderRetroWalls(width, height);
  // All objects share the same projection as the textured floor.
  renderObjects(width, height);
  const contact = cameraPoint(player.x, player.y, width, height);
  drawKart(width / 2 + player.steer * width * .018, contact ? contact.y : height * .83,
    Math.min(width * .16, height * .26), '#d84435', true);
  ctx.font = `bold ${Math.max(14, width * .025)}px monospace`;
  ctx.fillStyle = '#fff';
  ctx.shadowColor = '#182522'; ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
  ctx.textAlign = 'left';
  ctx.fillText(`POS ${document.querySelector('#position').textContent}/6`, 12, 30);
  ctx.textAlign = 'center';
  ctx.fillText(`LAP ${document.querySelector('#lap').textContent}/3`, width / 2, 30);
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(Math.abs(player.speed))} KM/H`, width - 12, 30);
  ctx.restore();
};
