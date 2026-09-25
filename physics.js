/* Axis-separated solid collisions. Visual surfaces use these same rectangles. */
globalThis.LumiPhysics = {
  step(body, solids, dt) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(body.vx), Math.abs(body.vy)) * dt / 6));
    const h = dt / steps;
    let landed = false;
    for (let i = 0; i < steps; i++) {
      const oldX = body.x;
      body.x += body.vx * h;
      for (const s of solids) {
        if (body.y + body.h <= s.y + .01 || body.y >= s.y + s.h) continue;
        if (body.x + body.w > s.x && body.x < s.x + s.w) {
          if (oldX + body.w <= s.x + .1) { body.x = s.x - body.w; body.vx = 0; }
          else if (oldX >= s.x + s.w - .1) { body.x = s.x + s.w; body.vx = 0; }
        }
      }
      const oldY = body.y;
      body.vy = Math.min(1000, body.vy + 1700 * h);
      body.y += body.vy * h;
      body.onGround = false;
      for (const s of solids) {
        if (body.x + body.w <= s.x || body.x >= s.x + s.w) continue;
        if (body.vy >= 0 && oldY + body.h <= s.y + .1 && body.y + body.h >= s.y) {
          landed ||= body.vy > 150;
          body.y = s.y - body.h; body.vy = 0; body.onGround = true;
        } else if (body.vy < 0 && oldY >= s.y + s.h - .1 && body.y <= s.y + s.h) {
          body.y = s.y + s.h; body.vy = 0;
        }
      }
    }
    return landed;
  }
};
