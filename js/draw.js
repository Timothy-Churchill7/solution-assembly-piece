/* draw.js — canvas primitives.
   Tracked type, bevelled steel plates, rivets, hatch bands, CRT grain.
   Deliberately low-level: every screen is drawn from these parts so the
   whole build shares one material vocabulary. */
(function (root) {
  'use strict';

  var SOL = root.SOL || (root.SOL = {});
  var P = SOL.P;
  var D = SOL.D = {};

  /* ---------- type ---------- */

  function fontStr(o) {
    var style = o.italic ? 'italic ' : '';
    var weight = o.weight || 400;
    var fam = (o.family === 'sans') ? SOL.FONT.sans : SOL.FONT.mono;
    return style + weight + ' ' + (o.size || 14) + 'px ' + fam;
  }
  D.fontStr = fontStr;

  // Width of a string including manual letter tracking.
  function measure(ctx, s, o) {
    o = o || {};
    ctx.font = fontStr(o);
    var track = o.track || 0;
    if (!track) return ctx.measureText(s).width;
    var w = 0;
    for (var i = 0; i < s.length; i++) w += ctx.measureText(s[i]).width + track;
    return w - track;
  }
  D.measure = measure;

  /* Draw text. Tracking is applied per-character so it renders identically
     in every browser (ctx.letterSpacing is Chromium-only). */
  function txt(ctx, s, x, y, o) {
    o = o || {};
    s = String(s);
    ctx.save();
    ctx.font = fontStr(o);
    ctx.fillStyle = o.color || P.text;
    ctx.textBaseline = o.baseline || 'alphabetic';
    if (o.alpha != null) ctx.globalAlpha = o.alpha;

    var track = o.track || 0;
    var align = o.align || 'left';

    if (!track) {
      ctx.textAlign = align;
      ctx.fillText(s, x, y);
      ctx.restore();
      return measure(ctx, s, o);
    }

    var w = measure(ctx, s, o);
    var cx = x;
    if (align === 'center') cx = x - w / 2;
    else if (align === 'right') cx = x - w;
    ctx.textAlign = 'left';
    for (var i = 0; i < s.length; i++) {
      ctx.fillText(s[i], cx, y);
      cx += ctx.measureText(s[i]).width + track;
    }
    ctx.restore();
    return w;
  }
  D.txt = txt;

  // Greedy word wrap. Returns an array of lines.
  function wrap(ctx, s, maxW, o) {
    o = o || {};
    var paras = String(s).split('\n');
    var out = [];
    for (var p = 0; p < paras.length; p++) {
      if (paras[p] === '') { out.push(''); continue; }
      var words = paras[p].split(/\s+/);
      var line = '';
      for (var i = 0; i < words.length; i++) {
        var trial = line ? line + ' ' + words[i] : words[i];
        if (measure(ctx, trial, o) > maxW && line) {
          out.push(line);
          line = words[i];
        } else {
          line = trial;
        }
      }
      out.push(line);
    }
    return out;
  }
  D.wrap = wrap;

  // Draw a wrapped paragraph; returns the y after the last line.
  function para(ctx, s, x, y, maxW, o) {
    o = o || {};
    var lh = o.lineHeight || Math.round((o.size || 14) * 1.65);
    var lines = wrap(ctx, s, maxW, o);
    for (var i = 0; i < lines.length; i++) {
      txt(ctx, lines[i], x, y + i * lh, o);
    }
    return y + lines.length * lh;
  }
  D.para = para;

  /* Rich paragraph: runs = [{t:'text', italic:true, color:'#fff'}, ...].
     Used for the attribution, where the novel title is set in italic but
     the underlying string must stay exactly as written. */
  function paraRuns(ctx, runs, x, y, maxW, o) {
    o = o || {};
    var lh = o.lineHeight || Math.round((o.size || 14) * 1.65);
    var tokens = [];
    runs.forEach(function (r) {
      var parts = r.t.split(/(\s+)/);
      parts.forEach(function (t) {
        if (t === '') return;
        tokens.push({ t: t, ws: /^\s+$/.test(t), italic: !!r.italic, color: r.color });
      });
    });

    var cx = x, cy = y, lineStart = true;
    for (var i = 0; i < tokens.length; i++) {
      var tk = tokens[i];
      if (tk.ws) {
        if (!lineStart) cx += measure(ctx, ' ', o);
        continue;
      }
      var opt = Object.assign({}, o, { italic: tk.italic, color: tk.color || o.color });
      var w = measure(ctx, tk.t, opt);
      if (cx + w > x + maxW && !lineStart) {
        cy += lh; cx = x; lineStart = true;
      }
      txt(ctx, tk.t, cx, cy, opt);
      cx += w;
      lineStart = false;
    }
    return cy + lh;
  }
  D.paraRuns = paraRuns;

  /* ---------- geometry ---------- */

  function rrect(ctx, x, y, w, h, r) {
    r = Math.min(r || 0, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  D.rrect = rrect;

  function vgrad(ctx, x, y, w, h, top, bot) {
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, top);
    g.addColorStop(1, bot);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  }
  D.vgrad = vgrad;

  /* A bevelled steel plate: light catch on the top edge, shadow beneath. */
  function plate(ctx, x, y, w, h, o) {
    o = o || {};
    var r = o.r != null ? o.r : 3;
    ctx.save();
    rrect(ctx, x, y, w, h, r);
    var g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, o.top || P.plateHi);
    g.addColorStop(1, o.bot || P.plate);
    ctx.fillStyle = g;
    ctx.fill();

    // inner top highlight
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,' + (o.gloss != null ? o.gloss : 0.045) + ')';
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.restore();

    if (o.stroke !== false) {
      ctx.save();
      rrect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
      ctx.strokeStyle = o.strokeColor || 'rgba(0,0,0,0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
    return { x: x, y: y, w: w, h: h };
  }
  D.plate = plate;

  function rivet(ctx, x, y, r) {
    r = r || 3;
    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0.4, x, y, r);
    g.addColorStop(0, '#525a61');
    g.addColorStop(0.55, '#2b3237');
    g.addColorStop(1, '#0d1012');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  }
  D.rivet = rivet;

  function rivetsAround(ctx, x, y, w, h, inset, r) {
    inset = inset || 9; r = r || 2.6;
    rivet(ctx, x + inset, y + inset, r);
    rivet(ctx, x + w - inset, y + inset, r);
    rivet(ctx, x + inset, y + h - inset, r);
    rivet(ctx, x + w - inset, y + h - inset, r);
  }
  D.rivetsAround = rivetsAround;

  /* Diagonal hazard banding, in greys. Reads as caution without colour. */
  function hatch(ctx, x, y, w, h, o) {
    o = o || {};
    var step = o.step || 14;
    var a = o.a || '#22272b';
    var b = o.b || '#121618';
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = b; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = a;
    var shift = o.shift || 0;
    for (var i = -h; i < w + h; i += step * 2) {
      ctx.beginPath();
      ctx.moveTo(x + i + shift, y + h);
      ctx.lineTo(x + i + step + shift, y + h);
      ctx.lineTo(x + i + step + h + shift, y);
      ctx.lineTo(x + i + h + shift, y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  D.hatch = hatch;

  /* Stencilled label: small tracked caps over a darker seat. */
  function stencil(ctx, s, x, y, o) {
    o = o || {};
    return txt(ctx, String(s).toUpperCase(), x, y, {
      size: o.size || 10,
      weight: o.weight || 500,
      color: o.color || P.faint,
      track: o.track != null ? o.track : 2.4,
      align: o.align || 'left',
      alpha: o.alpha,
      baseline: o.baseline || 'alphabetic'
    });
  }
  D.stencil = stencil;

  /* A horizontal rule that looks machined rather than drawn. */
  function seam(ctx, x, y, w, o) {
    o = o || {};
    ctx.save();
    ctx.globalAlpha = o.alpha != null ? o.alpha : 1;
    ctx.fillStyle = o.dark || 'rgba(0,0,0,0.75)';
    ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = o.light || 'rgba(255,255,255,0.05)';
    ctx.fillRect(x, y + 1, w, 1);
    ctx.restore();
  }
  D.seam = seam;

  /* Meter bar: hollow steel channel with a filled portion. */
  function meter(ctx, x, y, w, h, frac, o) {
    o = o || {};
    frac = Math.max(0, Math.min(1, frac));
    ctx.save();
    rrect(ctx, x, y, w, h, 1.5);
    ctx.fillStyle = o.trough || '#0a0c0e';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.8)';
    ctx.lineWidth = 1;
    rrect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 1.5);
    ctx.stroke();
    if (frac > 0) {
      var fw = Math.max(1.5, (w - 2) * frac);
      var g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, o.hi || P.mid);
      g.addColorStop(1, o.lo || P.dim);
      ctx.fillStyle = g;
      rrect(ctx, x + 1, y + 1, fw, h - 2, 1);
      ctx.fill();
    }
    // tick marks every 10%
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    for (var i = 1; i < 10; i++) ctx.fillRect(x + (w * i / 10), y + 1, 1, h - 2);
    ctx.restore();
  }
  D.meter = meter;

  /* ---------- CRT surface ---------- */

  var noiseTile = null;
  function getNoise() {
    if (noiseTile) return noiseTile;
    var n = 128;
    var c = document.createElement('canvas');
    c.width = c.height = n;
    var x = c.getContext('2d');
    var img = x.createImageData(n, n);
    for (var i = 0; i < n * n; i++) {
      var v = (Math.random() * 255) | 0;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    noiseTile = c;
    return c;
  }

  /* Grain + scanlines + vignette. Applied last, over everything. */
  D.crt = function (ctx, w, h, t) {
    ctx.save();

    // grain
    ctx.globalAlpha = 0.035;
    ctx.globalCompositeOperation = 'overlay';
    var nt = getNoise();
    var ox = (Math.floor(t * 37) % 128);
    var oy = (Math.floor(t * 53) % 128);
    var pat = ctx.createPattern(nt, 'repeat');
    ctx.save();
    ctx.translate(-ox, -oy);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w + 128, h + 128);
    ctx.restore();

    // scanlines
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.11;
    ctx.fillStyle = '#000';
    for (var y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

    // a single slow roll bar
    ctx.globalAlpha = 0.05;
    var by = ((t * 42) % (h + 260)) - 130;
    var g = ctx.createLinearGradient(0, by, 0, by + 130);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(210,225,235,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, by, w, 130);

    // vignette
    ctx.globalAlpha = 1;
    var vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.40, w / 2, h / 2, h * 1.02);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.50)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();
  };

  /* ---------- misc ---------- */

  D.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  D.lerp = function (a, b, t) { return a + (b - a) * t; };
  D.easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  D.inRect = function (px, py, r) {
    return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
  };

  /* Deterministic pseudo-random, so decorative detail is stable between
     frames and between screenshot runs. */
  D.rnd = function (seed) {
    var s = Math.sin(seed * 12.9898) * 43758.5453;
    return s - Math.floor(s);
  };

})(typeof window !== 'undefined' ? window : globalThis);
