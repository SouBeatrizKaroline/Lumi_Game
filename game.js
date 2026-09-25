const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;
const keys = new Set();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const forestArt = new Image(); forestArt.src = 'forest-art.png';
const lumiArt = new Image(); lumiArt.src = 'lumi-spritesheet.png';
const spriteFrames = [
  [0,0], [1,0], [2,0], [3,0],
  [0,1], [1,1], [2,1], [3,1]
];

const world = {
  width: 6200,
  ground: 602,
  platforms: [
    { x: 260, y: 525, w: 205, h: 22 }, { x: 540, y: 455, w: 190, h: 22 },
    { x: 820, y: 390, w: 185, h: 22 }, { x: 1100, y: 468, w: 205, h: 22 },
    { x: 1390, y: 410, w: 200, h: 22 }, { x: 1690, y: 350, w: 185, h: 22 },
    { x: 1990, y: 470, w: 240, h: 22 }, { x: 2280, y: 415, w: 210, h: 22 },
    { x: 2550, y: 355, w: 190, h: 22 }, { x: 2850, y: 455, w: 260, h: 22 },
    { x: 3180, y: 500, w: 390, h: 22 }, { x: 3650, y: 420, w: 220, h: 22 },
    { x: 3970, y: 360, w: 190, h: 22 }, { x: 4280, y: 465, w: 230, h: 22 },
    { x: 4600, y: 395, w: 210, h: 22 }, { x: 4920, y: 455, w: 250, h: 22 },
    { x: 5270, y: 390, w: 210, h: 22 }, { x: 5570, y: 470, w: 360, h: 22 }
  ],
  stars: [],
  checkpoints: [
    { x: 80, name: 'forest edge' }, { x: 1580, name: 'mushroom grove' },
    { x: 3130, name: 'stream bridge' }, { x: 4520, name: 'ancestral clearing' }
  ]
};
for (let i = 0; i < 20; i++) {
  const x = 320 + i * 285;
  const platform = [...world.platforms].reverse().find(p => x >= p.x - 30 && x <= p.x + p.w + 30);
  world.stars.push({ x, y: platform ? platform.y - 38 : 535, secret: false, got: false, phase: i });
}
[[1220, 300], [2730, 270], [5140, 305]].forEach(([x, y], i) => world.stars.push({ x, y, secret: true, got: false, phase: i + 20 }));

const player = { x: 88, y: 520, w: 40, h: 62, vx: 0, vy: 0, onGround: false, coyote: 0, buffer: 0, checkpoint: 0, facing: 1, anim: 0, land: 0 };
const particles = [];
let camera = 0;
let time = 0;
let won = false;
let muted = false;
let audio;
let last = 0;

function collected() { return world.stars.filter(star => star.got).length; }
function stage() { return Math.min(4, Math.floor(world.stars.filter(star => !star.secret && star.got).length / 5)); }
function say(text, seconds = 2) {
  const box = document.querySelector('#message');
  box.textContent = text;
  box.classList.add('show');
  clearTimeout(say.timer);
  say.timer = setTimeout(() => box.classList.remove('show'), seconds * 1000);
}
function burst(x, y, color = '#ffe486', amount = 12) {
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 35 + Math.random() * 150;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 25, life: .65 + Math.random() * .7, max: 1.35, size: 2 + Math.random() * 4, color });
  }
}
function sound(frequency = 660) {
  if (muted) return;
  try {
    audio ||= new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.045, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .16);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + .17);
  } catch { /* audio is optional */ }
}
function respawn() {
  const checkpoint = world.checkpoints[player.checkpoint];
  player.x = checkpoint.x; player.y = 500; player.vx = 0; player.vy = 0;
  say('A soft landing. Keep going.', 1.5);
}
function setKey(key, pressed) {
  if (pressed) keys.add(key); else keys.delete(key);
}
function jumpPressed() {
  player.buffer = .17;
}
addEventListener('keydown', event => {
  const key = event.key.toLowerCase();
  if ([' ', 'arrowleft', 'arrowright', 'arrowup'].includes(key)) event.preventDefault();
  if (!keys.has(key) && [' ', 'w', 'arrowup'].includes(key)) jumpPressed();
  setKey(key, true);
  if (key === 'r') respawn();
});
addEventListener('keyup', event => setKey(event.key.toLowerCase(), false));
addEventListener('blur', () => keys.clear());
document.querySelectorAll('.touch-controls button').forEach(button => {
  const key = button.dataset.key === 'left' ? 'arrowleft' : button.dataset.key === 'right' ? 'arrowright' : ' ';
  button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); setKey(key, true); if (key === ' ') jumpPressed(); });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, () => setKey(key, false));
});
document.querySelector('#soundButton').addEventListener('click', () => {
  muted = !muted;
  document.querySelector('#soundButton').setAttribute('aria-pressed', String(muted));
  say(muted ? 'Sound off' : 'Sound on', 1);
});
document.querySelector('#contrastButton').addEventListener('click', () => {
  document.body.classList.toggle('high-contrast');
  const button = document.querySelector('#contrastButton');
  button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
});

function move(dt) {
  const left = keys.has('a') || keys.has('arrowleft');
  const right = keys.has('d') || keys.has('arrowright');
  const direction = Number(right) - Number(left);
  const acceleration = player.onGround ? 1850 : 1050;
  if (direction) { player.vx += direction * acceleration * dt; player.facing = direction; }
  else player.vx *= Math.exp(-(player.onGround ? 11 : 2.2) * dt);
  player.vx = Math.max(-300, Math.min(300, player.vx));

  if ((keys.has(' ') || keys.has('w') || keys.has('arrowup')) && player.onGround) jumpPressed();
  player.buffer = Math.max(0, player.buffer - dt);
  if (player.onGround) player.coyote = .14;
  else player.coyote = Math.max(0, player.coyote - dt);
  if (player.buffer > 0 && (player.onGround || player.coyote > 0)) {
    player.vy = -650; player.onGround = false; player.coyote = 0; player.buffer = 0;
    burst(player.x + player.w / 2, player.y + player.h, '#91cfff', 5); sound(480);
  }

  // Substeps prevent tunnelling through narrow platforms at high fall speeds.
  const steps = Math.max(1, Math.ceil(dt * Math.max(Math.abs(player.vx), Math.abs(player.vy)) / 9));
  const step = dt / steps;
  for (let i = 0; i < steps; i++) {
    const oldBottom = player.y + player.h;
    player.x = Math.max(0, Math.min(world.width - player.w, player.x + player.vx * step));
    player.vy = Math.min(900, player.vy + 1700 * step);
    player.y += player.vy * step;
    player.onGround = false;
    let floor = player.y + player.h >= world.ground ? world.ground : Infinity;
    for (const platform of world.platforms) {
      const overlapsX = player.x + player.w - 7 > platform.x && player.x + 7 < platform.x + platform.w;
      if (overlapsX && player.vy >= 0 && oldBottom <= platform.y + 2 && player.y + player.h >= platform.y) floor = Math.min(floor, platform.y);
      // The platforms have solid sides and undersides, so Lumi can land, bump, and stand on them.
      const overlapsY = player.y < platform.y + platform.h && player.y + player.h > platform.y;
      const crossedRight = player.x + player.w > platform.x && player.x + player.w - player.vx * step <= platform.x;
      const crossedLeft = player.x < platform.x + platform.w && player.x - player.vx * step >= platform.x + platform.w;
      if (overlapsY && crossedRight) player.x = platform.x - player.w;
      if (overlapsY && crossedLeft) player.x = platform.x + platform.w;
      if (player.vy < 0 && overlapsX && player.y < platform.y + platform.h && player.y - player.vy * step >= platform.y + platform.h) {
        player.y = platform.y + platform.h; player.vy = 35;
      }
    }
    if (floor !== Infinity && player.y + player.h >= floor && player.vy >= 0) {
      player.y = floor - player.h;
      if (!player.onGround && player.vy > 130) { player.land = 1; burst(player.x + player.w / 2, floor, '#91cfff', 4); }
      player.vy = 0; player.onGround = true;
    }
  }

  player.anim += dt * (player.onGround ? Math.abs(player.vx) * .045 : 4);
  player.land = Math.max(0, player.land - dt * 4);
  for (const star of world.stars) {
    if (!star.got && Math.hypot(player.x + 20 - star.x, player.y + 30 - star.y) < 39) {
      star.got = true; burst(star.x, star.y, star.secret ? '#b8e9ff' : '#ffe486', 18); sound(star.secret ? 880 : 720);
      say(star.secret ? 'Secret star found!' : 'A star remembers you.', 1.3);
    }
  }
  world.checkpoints.forEach((checkpoint, index) => {
    if (player.x >= checkpoint.x && player.checkpoint < index) { player.checkpoint = index; burst(checkpoint.x + 20, world.ground - 44, '#9de8d0', 10); say(`Checkpoint: ${checkpoint.name}`, 1.8); }
  });
  document.querySelector('#checkpointText').textContent = `Checkpoint: ${world.checkpoints[player.checkpoint].name}`;
  if (player.y > H + 160) respawn();
  if (player.x > world.width - 150 && world.stars.filter(star => !star.secret && star.got).length === 20) {
    won = true; say('The forest remembers its light.', 10); burst(player.x, player.y, '#ffe486', 70); sound(990);
  }
  const targetCamera = Math.max(0, Math.min(world.width - W, player.x - W * .36));
  camera += (targetCamera - camera) * Math.min(1, dt * 5);
}

function update(dt) {
  time += dt;
  if (!won) move(dt);
  for (const particle of particles) { particle.x += particle.vx * dt; particle.y += particle.vy * dt; particle.vy += 85 * dt; particle.life -= dt; }
  for (let i = particles.length - 1; i >= 0; i--) if (particles[i].life <= 0) particles.splice(i, 1);
}
function roundedRect(x, y, w, h, r, fill) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function drawSky(level) {
  const palettes = [['#111a3d','#21315e'],['#14244d','#28476e'],['#183052','#326578'],['#30295d','#82609a'],['#34506b','#e4a871']];
  const [top, horizon] = palettes[level];
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, top); sky.addColorStop(1, horizon);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  if (forestArt.complete && forestArt.naturalWidth) {
    ctx.globalAlpha = .78;
    // Scale the whole illustration to one viewport so its horizon and bridge line up with gameplay.
    ctx.drawImage(forestArt, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  const parallax = camera * .15;
  for (let i = 0; i < 65; i++) {
    const x = ((i * 197 - parallax * (1 + i % 3) + world.width) % world.width);
    const y = 25 + (i * 83) % 290;
    ctx.globalAlpha = .35 + .45 * (Math.sin(time * 1.4 + i) * .5 + .5);
    ctx.fillStyle = i % 8 === 0 && level > 0 ? '#ffe69b' : '#dce9ff';
    ctx.beginPath(); ctx.arc(x, y, i % 6 === 0 ? 2.2 : 1.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 35; i++) {
    const x = i * 210 - camera * .27;
    ctx.fillStyle = i % 2 ? '#182a50' : '#1b315a';
    ctx.beginPath(); ctx.moveTo(x, 540); ctx.lineTo(x + 105, 210 + (i % 4) * 35); ctx.lineTo(x + 210, 540); ctx.fill();
  }
}
function drawPlatform(platform, level) {
  roundedRect(platform.x, platform.y + 8, platform.w, platform.h + 16, 7, '#172038');
  roundedRect(platform.x, platform.y, platform.w, platform.h, 7, level > 1 ? '#344e55' : '#364252');
  roundedRect(platform.x, platform.y, platform.w, 8, 5, level > 2 ? '#94c58b' : '#78a77b');
  ctx.fillStyle = '#b5d79a';
  for (let x = platform.x + 14; x < platform.x + platform.w - 6; x += 32) {
    const wave = Math.sin(time * 3 + x * .06) * 2;
    ctx.fillRect(x, platform.y - 2 + wave, 3, 5);
  }
}
function drawMushroom(x, y, glow = 1) {
  ctx.save();
  const bob = Math.sin(time * 2.2 + x) * 2;
  ctx.globalAlpha = .15 * glow; ctx.fillStyle = '#dc8aff'; ctx.beginPath(); ctx.arc(x, y - 12 + bob, 35, 0, 7); ctx.fill();
  roundedRect(x - 5, y - 21 + bob, 10, 20, 5, '#efb99d');
  ctx.fillStyle = glow > 2 ? '#e995ff' : '#e68cae'; ctx.beginPath(); ctx.ellipse(x, y - 22 + bob, 22, 13, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#fff1cd'; ctx.beginPath(); ctx.arc(x - 7, y - 26 + bob, 3, 0, 7); ctx.arc(x + 8, y - 24 + bob, 2.5, 0, 7); ctx.fill();
  ctx.restore();
}
function drawTree(x, base, scale = 1, ancestral = false) {
  ctx.save(); ctx.translate(x, base); ctx.scale(scale, scale);
  ctx.fillStyle = ancestral ? '#725b65' : '#202b45';
  ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-8, -110); ctx.lineTo(-35, -156); ctx.lineTo(-19, -147); ctx.lineTo(-30, -198); ctx.lineTo(-4, -166); ctx.lineTo(4, -238); ctx.lineTo(16, -164); ctx.lineTo(43, -203); ctx.lineTo(29, -149); ctx.lineTo(51, -160); ctx.lineTo(19, -106); ctx.lineTo(25, 0); ctx.closePath(); ctx.fill();
  if (ancestral) {
    ctx.strokeStyle = '#ffd775'; ctx.lineWidth = 5; ctx.shadowColor = '#ffc954'; ctx.shadowBlur = 20;
    for (let branch = -1; branch <= 1; branch++) { ctx.beginPath(); ctx.moveTo(0, -28); ctx.quadraticCurveTo(branch * 38, -110, branch * 72, -195); ctx.stroke(); }
  }
  ctx.restore();
}
function drawWorld(level) {
  if (forestArt.complete && forestArt.naturalWidth) {
    // Reuse the authored illustration in broad parallax panels behind the collision geometry.
    ctx.globalAlpha = .62;
    const panelWidth = 1850;
    const shift = camera * .33;
    for (let panel = 0; panel < 4; panel++) {
      const x = panel * panelWidth + shift;
      ctx.drawImage(forestArt, 0, 280, forestArt.naturalWidth, 470, x, 155, panelWidth, 447);
    }
    ctx.globalAlpha = 1;
  }
  for (let i = 0; i < 26; i++) drawTree(i * 255 + 70, 604, .75 + (i % 3) * .12);
  ctx.fillStyle = ['#1d2945','#22394c','#2d4b4c','#43505c','#586364'][level];
  ctx.fillRect(0, world.ground, world.width, H - world.ground);
  for (let x = 0; x < world.width; x += 80) {
    ctx.fillStyle = level > 1 ? '#668267' : '#3e604f';
    ctx.fillRect(x + 8, world.ground + 7 + (x % 3), 25, 3);
  }
  // The stream has a visible gap in the ground; the timber bridge is a safe crossing.
  ctx.fillStyle = '#153b5a'; ctx.fillRect(3130, world.ground, 700, 118);
  const water = ctx.createLinearGradient(0, world.ground, 0, world.ground + 110); water.addColorStop(0, '#54cbe7'); water.addColorStop(1, '#145477');
  ctx.fillStyle = water; ctx.fillRect(3130, world.ground + 8, 700, 96);
  for (let x = 3150; x < 3820; x += 56) { ctx.strokeStyle = '#a2f1eb'; ctx.globalAlpha = .55; ctx.beginPath(); ctx.moveTo(x + Math.sin(time * 2 + x) * 8, 630 + (x % 4) * 8); ctx.lineTo(x + 23, 630 + (x % 4) * 8); ctx.stroke(); }
  ctx.globalAlpha = 1;
  roundedRect(3160, 558, 640, 27, 6, '#755548');
  for (let x = 3180; x < 3790; x += 68) { ctx.fillStyle = '#aa7956'; ctx.fillRect(x, 555, 6, 34); }
  ctx.fillStyle = '#574252';
  for (let x = 3175; x < 3790; x += 105) ctx.fillRect(x, 584, 9, 30);
  for (const platform of world.platforms) drawPlatform(platform, level);
  for (let x = 650; x < world.width; x += 510) drawMushroom(x, world.ground - 1, 1 + level * .6);
  drawTree(5500, world.ground, 1.65, true);
  // The glowing ancestral tree silhouette grows brighter with the rescued stars.
  ctx.save(); ctx.translate(5485, 375); ctx.globalAlpha = .38 + level * .11;
  ctx.fillStyle = '#ffd46b'; ctx.shadowColor = '#ffcb55'; ctx.shadowBlur = 36;
  ctx.beginPath(); ctx.ellipse(0, 0, 115, 125, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(5500, world.ground); ctx.strokeStyle = '#ffdf8d'; ctx.lineWidth = 11; ctx.shadowColor = '#ffd46b'; ctx.shadowBlur = 28;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -205); ctx.moveTo(0, -130); ctx.quadraticCurveTo(-55, -170, -90, -220); ctx.moveTo(0, -155); ctx.quadraticCurveTo(60, -190, 95, -237); ctx.stroke(); ctx.restore();
  // Lanterns and small fireflies respond to the forest's returned light.
  for (let x = 890; x < world.width - 400; x += 980) {
    ctx.strokeStyle = '#785b58'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, 485); ctx.lineTo(x, 548); ctx.stroke();
    ctx.fillStyle = '#ffdc87'; ctx.shadowColor = '#ffc954'; ctx.shadowBlur = 16 + level * 5;
    ctx.beginPath(); ctx.arc(x, 494, 8, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  }
  for (const star of world.stars) if (!star.got) {
    const bob = reducedMotion ? 0 : Math.sin(time * 2.5 + star.phase) * 6;
    ctx.save(); ctx.translate(star.x, star.y + bob); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = star.secret ? '#e49cff' : '#ffe587'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 15;
    ctx.fillRect(-7, -7, 14, 14); ctx.restore();
    ctx.save(); ctx.translate(star.x, star.y + bob); ctx.fillStyle = '#fff4c6'; ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center'; ctx.fillText('✦', 0, 4); ctx.restore();
  }
  for (const particle of particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.max); ctx.fillStyle = particle.color;
    ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function drawLumi() {
  if (lumiArt.complete && lumiArt.naturalWidth) {
    const frameWidth = lumiArt.naturalWidth / 4;
    const frameHeight = lumiArt.naturalHeight / 2;
    let pose = 0;
    if (!player.onGround) pose = player.vy < 0 ? 4 : 5;
    else if (player.land > .7) pose = 6;
    else if (won) pose = 7;
    else if (Math.abs(player.vx) > 235) pose = 3;
    else if (Math.abs(player.vx) > 28) pose = Math.floor(player.anim / 5) % 2 + 1;
    const [column, row] = spriteFrames[pose];
    const sourceX = column * frameWidth, sourceY = row * frameHeight;
    const destinationWidth = 88, destinationHeight = 92;
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2);
    ctx.scale(player.facing, 1);
    ctx.globalAlpha = .22;
    ctx.fillStyle = '#040817'; ctx.beginPath(); ctx.ellipse(0, 33, 28, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.drawImage(lumiArt, sourceX, sourceY, frameWidth, frameHeight, -destinationWidth / 2, -destinationHeight / 2, destinationWidth, destinationHeight);
    ctx.restore();
    return;
  }
  const stride = player.onGround ? Math.sin(player.anim) : 0;
  const bob = player.onGround ? Math.abs(stride) * 2 : Math.sin(time * 9) * 2;
  const squash = player.land ? 1 - player.land * .08 : 1;
  ctx.save(); ctx.translate(player.x + player.w / 2, player.y + player.h / 2 + bob); ctx.scale(player.facing * squash, 1 / squash);
  // Soft shadow follows Lumi and shrinks while she is high in the air.
  ctx.globalAlpha = Math.max(.12, 1 - Math.max(0, world.ground - player.y - player.h) / 280);
  ctx.fillStyle = '#050a18'; ctx.beginPath(); ctx.ellipse(0, 34 + Math.max(0, world.ground - player.y - player.h) * .12, 22, 5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  ctx.translate(0, -25);
  ctx.fillStyle = '#151927';
  ctx.beginPath(); ctx.ellipse(0, 22, 18, 21, 0, 0, 7); ctx.fill();
  // Tail swishes opposite the movement.
  ctx.strokeStyle = '#202538'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-11, 30); ctx.quadraticCurveTo(-29, 25 + Math.sin(time * 6) * 7, -23, 11); ctx.stroke();
  // Ears and soft pink inner ears.
  ctx.fillStyle = '#151927'; ctx.beginPath(); ctx.moveTo(-16, 5); ctx.lineTo(-14, -20); ctx.lineTo(-1, -7); ctx.lineTo(2, -19); ctx.lineTo(17, 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#cc809f'; ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(-12, -13); ctx.lineTo(-5, -5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(6, -5); ctx.lineTo(12, -13); ctx.lineTo(14, 1); ctx.closePath(); ctx.fill();
  // Face looks in the direction Lumi is travelling.
  ctx.fillStyle = '#1b2030'; ctx.beginPath(); ctx.ellipse(0, 3, 22, 19, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#f6c64c'; ctx.beginPath(); ctx.ellipse(-8, 4, 5, 7, 0, 0, 7); ctx.ellipse(8, 4, 5, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#0b1222'; ctx.beginPath(); ctx.ellipse(-8 + Math.sign(player.vx) * .8, 4, 2, 5, 0, 0, 7); ctx.ellipse(8 + Math.sign(player.vx) * .8, 4, 2, 5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff2c5'; ctx.beginPath(); ctx.arc(-9, 1, 1.5, 0, 7); ctx.arc(7, 1, 1.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#e39aaa'; ctx.beginPath(); ctx.moveTo(-2, 12); ctx.lineTo(2, 12); ctx.lineTo(0, 14); ctx.fill();
  // Blue scarf flutters more strongly while running or jumping.
  ctx.fillStyle = '#3470cc'; ctx.beginPath(); ctx.moveTo(-18, 18); ctx.quadraticCurveTo(0, 12, 18, 19); ctx.lineTo(10, 27); ctx.lineTo(-11, 26); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-9, 23); ctx.quadraticCurveTo(-19 - Math.abs(player.vx) * .025, 37, -26 - Math.abs(player.vx) * .035, 30 + Math.sin(time * 11) * 4); ctx.lineTo(-13, 27); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffe278'; ctx.shadowColor = '#ffd15d'; ctx.shadowBlur = 10;
  ctx.beginPath(); ctx.moveTo(4, 26); ctx.lineTo(8, 20); ctx.lineTo(12, 26); ctx.lineTo(18, 27); ctx.lineTo(13, 32); ctx.lineTo(14, 38); ctx.lineTo(8, 35); ctx.lineTo(2, 38); ctx.lineTo(3, 32); ctx.lineTo(-1, 28); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  // Tiny feet animate during a run.
  ctx.fillStyle = '#111725'; roundedRect(-12 + stride * 4, 37, 10, 5, 3, '#111725'); roundedRect(3 - stride * 4, 37, 10, 5, 3, '#111725');
  ctx.restore();
}
function draw() {
  const level = stage(); drawSky(level);
  ctx.save(); ctx.translate(-camera, 0); drawWorld(level); drawLumi(); ctx.restore();
  const mainStars = world.stars.filter(star => !star.secret && star.got).length;
  const secretStars = world.stars.filter(star => star.secret && star.got).length;
  document.querySelector('#progressText').textContent = `✦ ${mainStars}/20　✧ ${secretStars}/3`;
}
function loop(now) {
  const dt = Math.min(.032, (now - last) / 1000 || 0); last = now;
  update(dt); draw(); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
canvas.focus();
