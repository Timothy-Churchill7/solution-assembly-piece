/* scene.js — the hall.
   A shared backdrop drawn behind every screen so the menu, the line and
   the ending are recognisably the same room. Silhouette and lamp-light
   only; no depiction of anything beyond machinery. */
(function (root) {
  'use strict';

  var SOL = root.SOL, P = SOL.P, D = SOL.D;
  var S = SOL.scene = {};

  /* ---------- deep background ---------- */

  function backwall(ctx, w, h, t, mood, floorY) {
    // wall: lighter where the lamps reach it, sooty at the extremes
    var g = ctx.createLinearGradient(0, 0, 0, floorY);
    g.addColorStop(0, '#181a1c');
    g.addColorStop(0.30, '#282b2e');
    g.addColorStop(0.75, '#2d3134');
    g.addColorStop(1, '#1c1e20');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, floorY);

    // brick-ish courses, very low contrast, just enough to catch the eye
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (var cy = 96; cy < floorY; cy += 17) {
      ctx.fillStyle = 'rgba(0,0,0,0.20)';
      ctx.fillRect(0, cy, w, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.014)';
      ctx.fillRect(0, cy + 1, w, 1);
    }
    ctx.restore();

    // clerestory band: weak daylight, heavily grimed
    var by = S.CLERESTORY.y, bh = S.CLERESTORY.h;
    ctx.save();
    for (var i = 0; i < 8; i++) {
      var pitch = (w - 60) / 8;
      var x = 30 + i * pitch;
      var ww = pitch - 26;
      var wg = ctx.createLinearGradient(0, by, 0, by + bh);
      wg.addColorStop(0, 'rgba(178,194,206,' + (0.30 * mood) + ')');
      wg.addColorStop(0.6, 'rgba(142,158,170,' + (0.14 * mood) + ')');
      wg.addColorStop(1, 'rgba(110,124,136,' + (0.02 * mood) + ')');
      ctx.fillStyle = wg;
      ctx.fillRect(x, by, ww, bh);
      // muntins
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.fillRect(x + ww / 2 - 1.5, by, 3, bh);
      for (var m = 1; m < 3; m++) ctx.fillRect(x, by + bh * m / 3 - 1, ww, 2);
      // frame
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 1.5, by - 1.5, ww + 3, bh + 3);
      ctx.strokeStyle = 'rgba(190,205,216,' + (0.07 * mood) + ')';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 3.5, by - 3.5, ww + 7, bh + 7);
      // spill onto the wall below each window
      var sg = ctx.createLinearGradient(0, by + bh, 0, by + bh + 130);
      sg.addColorStop(0, 'rgba(186,202,214,' + (0.09 * mood) + ')');
      sg.addColorStop(1, 'rgba(176,192,204,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(x - 6, by + bh, ww + 12, 130);
    }
    ctx.restore();

    // pilasters, standing on the floor so the wall has depth
    for (var j = 0; j < 8; j++) {
      var px = -6 + j * (w + 12) / 7.4;
      var pg = ctx.createLinearGradient(px, 0, px + 40, 0);
      pg.addColorStop(0, 'rgba(6,8,9,0.85)');
      pg.addColorStop(0.35, 'rgba(40,47,53,0.75)');
      pg.addColorStop(1, 'rgba(8,10,12,0.85)');
      ctx.fillStyle = pg;
      ctx.fillRect(px, 210, 40, floorY - 210);
      ctx.fillStyle = 'rgba(214,226,235,0.05)';
      ctx.fillRect(px + 13, 210, 1, floorY - 210);
      // capital
      ctx.fillStyle = 'rgba(52,60,67,0.6)';
      ctx.fillRect(px - 4, 210, 48, 7);
    }
  }

  /* ---------- overhead steel ---------- */

  /* Overhead steel is read against the bright window band, so it is drawn
     nearly black with a light catch on the upper flange. */
  function truss(ctx, w, y, depth, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = '#1b1d1e';
    ctx.fillStyle = '#1c1e20';
    ctx.lineWidth = 3;
    // chords
    ctx.fillRect(0, y, w, 8);
    ctx.fillRect(0, y + depth, w, 8);
    ctx.fillStyle = 'rgba(206,220,230,0.16)';
    ctx.fillRect(0, y, w, 1.5);
    ctx.fillRect(0, y + depth, w, 1.5);
    // web
    ctx.beginPath();
    var step = 52;
    for (var x = -step; x < w + step; x += step) {
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x + step / 2, y + depth);
      ctx.lineTo(x + step, y + 8);
    }
    ctx.stroke();
    // vertical posts
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (var vx = 0; vx < w + step; vx += step) {
      ctx.moveTo(vx, y + 8); ctx.lineTo(vx, y + depth);
    }
    ctx.stroke();
    ctx.restore();
  }

  function ducting(ctx, w, y, r, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    var g = ctx.createLinearGradient(0, y - r, 0, y + r);
    g.addColorStop(0, '#222528');
    g.addColorStop(0.28, '#50565a');
    g.addColorStop(0.55, '#313538');
    g.addColorStop(1, '#242628');
    ctx.fillStyle = g;
    ctx.fillRect(0, y - r, w, r * 2);
    // seam rings
    for (var x = 34; x < w; x += 124) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x, y - r - 2, 6, r * 2 + 4);
      ctx.fillStyle = 'rgba(190,205,216,0.10)';
      ctx.fillRect(x + 6, y - r - 2, 1, r * 2 + 4);
    }
    ctx.fillStyle = 'rgba(214,226,235,0.14)';
    ctx.fillRect(0, y - r + 4, w, 1);
    // hangers up to the deck
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var hx = 96; hx < w; hx += 124) { ctx.moveTo(hx, y - r); ctx.lineTo(hx, 0); }
    ctx.stroke();
    ctx.restore();
  }

  /* A shaded lamp with a cone of light. The only source of brightness. */
  function lamp(ctx, x, y, h, spread, floorY, intensity, flick) {
    var i = intensity * flick;
    ctx.save();
    // stem
    ctx.fillStyle = '#222528';
    ctx.fillRect(x - 1.5, y - h, 3, h);
    // shade
    ctx.beginPath();
    ctx.moveTo(x - 4, y - 2);
    ctx.lineTo(x + 4, y - 2);
    ctx.lineTo(x + 17, y + 12);
    ctx.lineTo(x - 17, y + 12);
    ctx.closePath();
    var sg = ctx.createLinearGradient(x - 17, y, x + 17, y + 12);
    sg.addColorStop(0, '#36393d');
    sg.addColorStop(0.45, '#494e52');
    sg.addColorStop(1, '#242628');
    ctx.fillStyle = sg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // filament
    ctx.globalAlpha = 0.85 * i;
    ctx.fillStyle = '#e2e6e8';
    ctx.beginPath(); ctx.arc(x, y + 12, 3.2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.28 * i;
    ctx.beginPath(); ctx.arc(x, y + 12, 9, 0, Math.PI * 2); ctx.fill();

    // cone
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    var cg = ctx.createLinearGradient(0, y + 12, 0, floorY);
    cg.addColorStop(0, 'rgba(198,213,224,' + (0.15 * i) + ')');
    cg.addColorStop(0.55, 'rgba(178,194,206,' + (0.06 * i) + ')');
    cg.addColorStop(1, 'rgba(150,166,178,0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.moveTo(x - 12, y + 12);
    ctx.lineTo(x + 12, y + 12);
    ctx.lineTo(x + spread, floorY);
    ctx.lineTo(x - spread, floorY);
    ctx.closePath();
    ctx.fill();

    // pool on the floor
    var pg = ctx.createRadialGradient(x, floorY, 2, x, floorY, spread * 1.25);
    pg.addColorStop(0, 'rgba(188,204,216,' + (0.13 * i) + ')');
    pg.addColorStop(1, 'rgba(160,176,188,0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.ellipse(x, floorY, spread * 1.25, spread * 0.30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  S.lamp = lamp;

  /* ---------- machine mass ---------- */

  /* A press housing standing on the floor. Bottom edge is the floor line,
     so these read as objects in the room rather than panels on the wall. */
  function machineBlock(ctx, x, floorY, w, h, seed) {
    var y = floorY - h;

    // cast shadow on the floor first
    ctx.save();
    var shg = ctx.createLinearGradient(0, floorY, 0, floorY + 46);
    shg.addColorStop(0, 'rgba(0,0,0,0.75)');
    shg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shg;
    ctx.fillRect(x - 10, floorY, w + 20, 46);
    ctx.restore();

    // body
    D.plate(ctx, x, y, w, h, { top: '#43484c', bot: '#1e2022', r: 2, gloss: 0.08 });

    // rim light along the top edge — the lamps are above
    ctx.fillStyle = 'rgba(206,220,230,0.20)';
    ctx.fillRect(x + 2, y, w - 4, 2);

    // hood
    ctx.beginPath();
    ctx.moveTo(x - 8, y); ctx.lineTo(x + w + 8, y);
    ctx.lineTo(x + w - 4, y - 14); ctx.lineTo(x + 4, y - 14);
    ctx.closePath();
    var hg = ctx.createLinearGradient(0, y - 14, 0, y);
    hg.addColorStop(0, '#51565a');
    hg.addColorStop(1, '#292c2f');
    ctx.fillStyle = hg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.lineWidth = 1; ctx.stroke();

    // vent grille
    var gx = x + 16, gy = y + 26, gw = w - 32, gh = Math.min(54, h * 0.30);
    ctx.save();
    ctx.fillStyle = '#141617';
    ctx.fillRect(gx, gy, gw, gh);
    ctx.fillStyle = '#50565a';
    for (var i = 0; i < gh - 3; i += 6) ctx.fillRect(gx, gy + i + 1, gw, 2.5);
    ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 2;
    ctx.strokeRect(gx - 1, gy - 1, gw + 2, gh + 2);
    ctx.restore();

    // inspection window — dark glass with a single dull reflection
    var iw = Math.min(64, w * 0.3), ih = 30;
    var ix = x + w - iw - 18, iy = gy + gh + 20;
    D.plate(ctx, ix, iy, iw, ih, { top: '#1c1e20', bot: '#141617', r: 1 });
    ctx.fillStyle = 'rgba(196,212,224,0.07)';
    ctx.fillRect(ix + 4, iy + 4, iw - 8, 5);

    // legs
    ctx.fillStyle = '#191b1d';
    ctx.fillRect(x + 14, floorY - 4, 16, 4);
    ctx.fillRect(x + w - 30, floorY - 4, 16, 4);

    D.rivetsAround(ctx, x, y, w, h, 10, 2.6);

    // stencilled asset number
    D.stencil(ctx, 'M-' + (100 + Math.floor(D.rnd(seed) * 800)), x + 18, y + h - 16,
      { size: 10, color: 'rgba(150,164,175,0.42)', track: 2.2 });
  }
  /* The window band, published because the aeroplane has to fly behind
     the glazing rather than in front of it. */
  S.CLERESTORY = { y: 122, h: 74, count: 8, inset: 30, gap: 26 };

  /* Redraw the muntins and the frames over a strip, so anything drawn
     inside the band reads as being on the far side of the glass. */
  S.reglaze = function (ctx, w, mood) {
    var by = S.CLERESTORY.y, bh = S.CLERESTORY.h;
    var pitch = (w - 2 * S.CLERESTORY.inset) / S.CLERESTORY.count;
    for (var i = 0; i < S.CLERESTORY.count; i++) {
      var x = S.CLERESTORY.inset + i * pitch, ww = pitch - S.CLERESTORY.gap;
      ctx.fillStyle = 'rgba(0,0,0,0.62)';
      ctx.fillRect(x + ww / 2 - 1.5, by, 3, bh);
      for (var m = 1; m < 3; m++) ctx.fillRect(x, by + bh * m / 3 - 1, ww, 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 1.5, by - 1.5, ww + 3, bh + 3);
      ctx.strokeStyle = 'rgba(190,205,216,' + (0.07 * mood) + ')';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 3.5, by - 3.5, ww + 7, bh + 7);
    }
  };

  S.machineBlock = machineBlock;

  /* Receding floor: converging seams toward a low vanishing point. */
  function floorPlane(ctx, w, h, floorY, mood) {
    var g = ctx.createLinearGradient(0, floorY, 0, h);
    g.addColorStop(0, '#2b2e31');
    g.addColorStop(0.35, '#202325');
    g.addColorStop(1, '#242628');
    ctx.fillStyle = g;
    ctx.fillRect(0, floorY, w, h - floorY);

    // skirting where wall meets floor
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, floorY - 2, w, 3);
    ctx.fillStyle = 'rgba(206,220,230,0.09)';
    ctx.fillRect(0, floorY + 1, w, 1);

    ctx.save();
    ctx.beginPath(); ctx.rect(0, floorY, w, h - floorY); ctx.clip();
    // converging seams
    var vpx = w / 2, vpy = floorY - 40;
    ctx.strokeStyle = 'rgba(206,220,230,0.045)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = -9; i <= 9; i++) {
      var bx = vpx + i * 190;
      ctx.moveTo(vpx + i * 22, vpy);
      ctx.lineTo(bx, h);
    }
    ctx.stroke();
    // lateral seams, spaced by perspective
    for (var k = 1; k < 9; k++) {
      var yy = floorY + Math.pow(k / 9, 1.9) * (h - floorY);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(0, yy, w, 1);
      ctx.fillStyle = 'rgba(206,220,230,0.035)';
      ctx.fillRect(0, yy + 1, w, 1);
    }
    ctx.restore();
  }
  S.floorPlane = floorPlane;

  /* ---------- the belt ---------- */

  /* Draws a conveyor band across the full width at the given top y.
     `phase` is the belt travel in pixels; slats scroll with it. */
  S.belt = function (ctx, x, y, w, h, phase, o) {
    o = o || {};
    ctx.save();
    // frame rails
    D.vgrad(ctx, x, y - 9, w, 9, '#3b4043', '#222528');
    D.vgrad(ctx, x, y + h, w, 11, '#36393d', '#171818');

    // belt surface
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#33373a');
    g.addColorStop(0.35, '#282b2e');
    g.addColorStop(1, '#1c1e20');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);

    // slats
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    var step = 34;
    var off = -(phase % step);
    for (var sx = off - step; sx < w + step; sx += step) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x + sx, y, 3, h);
      ctx.fillStyle = 'rgba(255,255,255,0.035)';
      ctx.fillRect(x + sx + 3, y, 1, h);
    }
    // worn centre track
    var wg = ctx.createLinearGradient(0, y + h * 0.25, 0, y + h * 0.8);
    wg.addColorStop(0, 'rgba(255,255,255,0.035)');
    wg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = wg;
    ctx.fillRect(x, y + h * 0.25, w, h * 0.55);
    ctx.restore();

    // rollers under the lip
    ctx.fillStyle = '#191b1d';
    for (var rx = x + 18; rx < x + w; rx += 62) {
      ctx.beginPath();
      ctx.ellipse(rx, y + h + 6, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.restore();
  };

  /* ---------- widgets ----------
     Four generic machined parts. Never labelled, never explained. */

  var FORMS = ['bracket', 'collar', 'yoke', 'pin'];
  S.FORMS = FORMS;

  S.widget = function (ctx, x, y, s, form, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    if (o.rot) ctx.rotate(o.rot);

    var body = ctx.createLinearGradient(0, -18, 0, 18);
    body.addColorStop(0, o.hi || '#4e5256');
    body.addColorStop(0.42, o.mid || '#313538');
    body.addColorStop(1, o.lo || '#242628');
    ctx.fillStyle = body;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = 1.4;

    if (form === 'bracket') {
      ctx.beginPath();
      ctx.moveTo(-20, -12); ctx.lineTo(20, -12); ctx.lineTo(20, -2);
      ctx.lineTo(-8, -2); ctx.lineTo(-8, 14); ctx.lineTo(-20, 14);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0b0c0c';
      ctx.beginPath(); ctx.arc(13, -7, 3, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(-14, 8, 3, 0, 6.3); ctx.fill();
    } else if (form === 'collar') {
      ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0b0c0c';
      ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.beginPath(); ctx.arc(0, 0, 12, 0.6, 3.4); ctx.stroke();
      // bolt lugs
      ctx.fillStyle = '#222628';
      for (var i = 0; i < 4; i++) {
        var a = i * Math.PI / 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 12.5, Math.sin(a) * 12.5, 2.4, 0, 6.3);
        ctx.fill();
      }
    } else if (form === 'yoke') {
      ctx.beginPath();
      ctx.moveTo(-18, 12); ctx.lineTo(-10, -12); ctx.lineTo(10, -12);
      ctx.lineTo(18, 12); ctx.lineTo(7, 12); ctx.lineTo(3, -2);
      ctx.lineTo(-3, -2); ctx.lineTo(-7, 12);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else { // pin
      ctx.beginPath();
      ctx.moveTo(-22, -4); ctx.lineTo(14, -4); ctx.lineTo(14, -8);
      ctx.lineTo(22, 0); ctx.lineTo(14, 8); ctx.lineTo(14, 4);
      ctx.lineTo(-22, 4);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0b0c0c';
      ctx.fillRect(-18, -2, 3, 4);
      ctx.fillRect(-11, -2, 3, 4);
    }

    // specular catch along the top
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = 'rgba(230,238,244,0.20)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-14, -11); ctx.lineTo(12, -11); ctx.stroke();
    ctx.restore();
  };

  /* Stacked crates: mid-ground mass, and later the thing you can open. */
  S.crates = function (ctx, x, floorY, seed, o) {
    o = o || {};
    var stack = [
      { w: 96, h: 64, dx: 0 },
      { w: 78, h: 54, dx: 12 },
      { w: 60, h: 44, dx: 26 }
    ];
    var n = o.count || 3;
    var y = floorY;
    ctx.save();
    var shg = ctx.createLinearGradient(0, floorY, 0, floorY + 32);
    shg.addColorStop(0, 'rgba(0,0,0,0.7)');
    shg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shg;
    ctx.fillRect(x - 12, floorY, 124, 32);
    ctx.restore();

    for (var i = 0; i < n && i < stack.length; i++) {
      var s = stack[i];
      var cx = x + s.dx + D.rnd(seed + i) * 6;
      y -= s.h;
      // near crates sit below the lamp cones: darker body, harder top rim,
      // so they separate from the machine row behind them by value.
      D.plate(ctx, cx, y, s.w, s.h, o.near
        ? { top: '#2c2f32', bot: '#171818', r: 1, gloss: 0.03 }
        : { top: '#3d4246', bot: '#222528', r: 1, gloss: 0.06 });
      // banding straps
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(cx + s.w * 0.24, y, 4, s.h);
      ctx.fillRect(cx + s.w * 0.68, y, 4, s.h);
      ctx.fillStyle = 'rgba(206,220,230,0.07)';
      ctx.fillRect(cx + s.w * 0.24 + 4, y, 1, s.h);
      // slat seam
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(cx, y + s.h * 0.5, s.w, 1);
      ctx.fillStyle = o.near ? 'rgba(214,228,238,0.30)' : 'rgba(206,220,230,0.16)';
      ctx.fillRect(cx + 1, y, s.w - 2, 1.5);
      D.stencil(ctx, o.mark || 'K-' + (10 + Math.floor(D.rnd(seed * 3 + i) * 89)),
        cx + 8, y + s.h - 9, { size: 8.5, color: 'rgba(150,164,175,0.34)', track: 1.8 });
    }
    ctx.restore();
  };

  /* A soft pool of lamp light laid over the working area of the belt, so
     parts on it are actually readable. */
  S.beltLight = function (ctx, x, y, w, h, intensity) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var g = ctx.createLinearGradient(0, y - 26, 0, y + h + 14);
    g.addColorStop(0, 'rgba(196,212,224,' + (0.15 * intensity) + ')');
    g.addColorStop(0.45, 'rgba(186,202,214,' + (0.085 * intensity) + ')');
    g.addColorStop(1, 'rgba(160,176,188,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y - 26, w, h + 40);
    ctx.restore();
  };

  /* ---------- dust ---------- */

  S.motes = function (ctx, w, h, t, n, alpha) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var sx = D.rnd(i * 3.1) * w;
      var drift = (t * (6 + D.rnd(i * 7.7) * 10)) % (h * 0.7);
      var sy = h * 0.16 + ((D.rnd(i * 5.3) * h * 0.7) + drift) % (h * 0.7);
      var r = 0.5 + D.rnd(i * 9.4) * 1.1;
      var a = alpha * (0.25 + 0.75 * Math.abs(Math.sin(t * 0.7 + i)));
      ctx.fillStyle = 'rgba(206,218,228,' + a + ')';
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  /* ---------- assembled hall ----------
     mood 0..1 — how much light the room is willing to give.
     Later shifts turn it down. */

  S.hall = function (ctx, t, opts) {
    opts = opts || {};
    var w = SOL.W, h = SOL.H;
    var mood = opts.mood != null ? opts.mood : 1;
    var floorY = opts.floorY || 548;

    backwall(ctx, w, h, t, mood, floorY);
    floorPlane(ctx, w, h, floorY, mood);

    // machine row, standing on the floor, varied so it isn't a repeat tile
    for (var i = 0; i < 5; i++) {
      var seed = i + 1;
      var bw = 176 + Math.floor(D.rnd(seed * 2.3) * 70);
      var bh = 148 + Math.floor(D.rnd(seed * 5.1) * 58);
      var mx = -24 + i * 258 + Math.floor(D.rnd(seed * 1.7) * 22);
      machineBlock(ctx, mx, floorY, bw, bh, seed);
    }

    // overhead structure, in front of everything
    ducting(ctx, w, 44, 14, 1);
    truss(ctx, w, 84, 36, 1);
    truss(ctx, w, 214, 24, 0.9);

    // lamps hung off the lower truss
    var flick = opts.still ? 1 :
      (0.94 + 0.06 * Math.sin(t * 3.1) + 0.025 * Math.sin(t * 17.3));
    var lampY = 246;
    var n = opts.lamps != null ? opts.lamps : 4;
    for (var L = 0; L < n; L++) {
      var lx = (w / (n + 1)) * (L + 1);
      var lf = opts.still ? 1 : (L === 1 ? flick : 0.97 + 0.03 * Math.sin(t * 2.1 + L));
      lamp(ctx, lx, lampY, 34, 150, floorY + 34, mood, lf);
    }

    S.motes(ctx, w, h, t, 34, 0.18 * mood);

    // soot creeping in from the edges, gentle enough to keep the room legible
    ctx.save();
    var sg = ctx.createLinearGradient(0, 0, 0, h);
    sg.addColorStop(0, 'rgba(0,0,0,0.20)');
    sg.addColorStop(0.42, 'rgba(0,0,0,0)');
    sg.addColorStop(1, 'rgba(0,0,0,0.13)');
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };

})(typeof window !== 'undefined' ? window : globalThis);
