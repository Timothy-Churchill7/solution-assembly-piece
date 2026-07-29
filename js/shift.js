/* shift.js — the line.
   One screen, one job: parts arrive, you stamp them, the clock runs out.
   Everything the plant records happens here. */
(function (root) {
  'use strict';

  var SOL = root.SOL, P = SOL.P, D = SOL.D, S = SOL.scene, C = SOL.content, L = SOL.logic;
  var E = SOL.econ;
  var W = SOL.W, H = SOL.H;
  var Screens = SOL.screens;

  /* ---------- fixed geometry ----------
     The press straddles the belt: housing above, legs running down behind
     it to the near floor, ram striking the belt surface. */
  var LAY = {
    hudY: 44, hudH: 70,
    floorY: 430,
    beltY: 520, beltH: 84,
    partY: 562,
    zoneX0: 452, zoneX1: 708,
    pressX: 580,
    housingY: 312, housingH: 108,
    ramRest: 424, ramTravel: 66,
    apronY: 618,
    exitX: W + 80,
    spawnX: -80,

    /* Line 5, upstage and running the other way: finished work going out to
       packing, passing the station on a raised conveyor. It is deliberately
       further from the eye than the press, because splitting attention
       across a distance is the whole of the second duty. */
    retY: 212, retH: 52, retPartY: 238,
    retZoneX0: 400, retZoneX1: 740,
    retSpeed: 88,
    retSpawnX: W + 80, retExitX: -90
  };
  var ZONE_MID = (LAY.zoneX0 + LAY.zoneX1) / 2;
  var RET_MID = (LAY.retZoneX0 + LAY.retZoneX1) / 2;

  /* ---------- the press ---------- */

  /* Everything that sits behind the belt: legs and housing. */
  function drawPressFrame(ctx) {
    var legTop = LAY.housingY + 20;
    var legBot = LAY.apronY + 4;
    [LAY.zoneX0 - 30, LAY.zoneX1 + 4].forEach(function (lx) {
      D.plate(ctx, lx, legTop, 26, legBot - legTop, { top: '#484d51', bot: '#1c1e20', r: 1 });
      ctx.fillStyle = 'rgba(214,228,238,0.12)';
      ctx.fillRect(lx + 1, legTop, 1.5, legBot - legTop);
      for (var ry = legTop + 22; ry < legBot - 10; ry += 58) D.rivet(ctx, lx + 13, ry, 2.6);
      // foot
      D.plate(ctx, lx - 7, legBot - 10, 40, 12, { top: '#383d40', bot: '#191b1d', r: 1 });
    });

    // housing
    var hx = LAY.zoneX0 - 14, hw = (LAY.zoneX1 - LAY.zoneX0) + 28;
    D.plate(ctx, hx, LAY.housingY, hw, LAY.housingH, { top: '#52585c', bot: '#222528', r: 2 });
    ctx.fillStyle = 'rgba(214,228,238,0.18)';
    ctx.fillRect(hx + 2, LAY.housingY, hw - 4, 2);
    // cooling fins
    ctx.save();
    for (var f = 0; f < 7; f++) {
      var fy = LAY.housingY + 20 + f * 9;
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(hx + 16, fy, hw - 32, 4);
      ctx.fillStyle = 'rgba(214,228,238,0.05)';
      ctx.fillRect(hx + 16, fy + 4, hw - 32, 1);
    }
    ctx.restore();
    D.rivetsAround(ctx, hx, LAY.housingY, hw, LAY.housingH, 12, 3);
    // maker's plate
    D.plate(ctx, hx + hw - 96, LAY.housingY + LAY.housingH - 26, 82, 17,
      { top: '#2c2f32', bot: '#1c1e20', r: 1 });
    D.stencil(ctx, 'PRESS 4-C', hx + hw - 88, LAY.housingY + LAY.housingH - 13,
      { size: 8.5, track: 1.8, color: 'rgba(160,174,185,0.55)' });

    // the housing lamp, aimed at the zone
    S.lamp(ctx, ZONE_MID, LAY.housingY - 16, 22, 118, LAY.beltY + LAY.beltH, 0.9, 1);
  }

  /* The ram, drawn in front of the parts. */
  function drawRam(ctx, drop) {
    var headTop = LAY.ramRest + drop * LAY.ramTravel;

    // guide rods
    ctx.fillStyle = '#181a1b';
    ctx.fillRect(500, LAY.housingY + LAY.housingH - 4, 7, headTop - LAY.housingY - LAY.housingH + 12);
    ctx.fillRect(653, LAY.housingY + LAY.housingH - 4, 7, headTop - LAY.housingY - LAY.housingH + 12);
    ctx.fillStyle = 'rgba(214,228,238,0.14)';
    ctx.fillRect(500, LAY.housingY + LAY.housingH - 4, 1.5, headTop - LAY.housingY - LAY.housingH + 12);

    // piston rod
    var rodTop = LAY.housingY + LAY.housingH - 6;
    var rg = ctx.createLinearGradient(560, 0, 600, 0);
    rg.addColorStop(0, '#282b2e');
    rg.addColorStop(0.4, '#6f7579');
    rg.addColorStop(1, '#131516');
    ctx.fillStyle = rg;
    ctx.fillRect(560, rodTop, 40, Math.max(0, headTop - rodTop));

    // head
    D.plate(ctx, 484, headTop, 192, 40, { top: '#60666a', bot: '#222528', r: 2 });
    ctx.fillStyle = 'rgba(226,238,246,0.24)';
    ctx.fillRect(486, headTop, 188, 2);
    // striking face
    D.vgrad(ctx, 490, headTop + 40, 180, 9, '#2d3133', '#131516');
    D.rivet(ctx, 498, headTop + 20, 2.8);
    D.rivet(ctx, 662, headTop + 20, 2.8);
    D.stencil(ctx, 'R4', 580, headTop + 26,
      { size: 10, track: 2, align: 'center', color: 'rgba(170,184,195,0.5)' });
  }

  /* Zone markings. This has to read instantly as "the place where you act",
     so it gets painted edges, guide posts and a lit floor. */
  function drawZone(ctx, t) {
    var x0 = LAY.zoneX0, x1 = LAY.zoneX1, y = LAY.beltY, h = LAY.beltH;

    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y, x1 - x0, h); ctx.clip();
    ctx.fillStyle = 'rgba(214,228,238,0.085)';
    ctx.fillRect(x0, y, x1 - x0, h);
    ctx.restore();

    // painted threshold lines on the belt
    ctx.fillStyle = 'rgba(226,238,246,0.42)';
    ctx.fillRect(x0 - 2, y, 3, h);
    ctx.fillRect(x1, y, 3, h);
    D.hatch(ctx, x0 - 12, y, 10, h, { step: 6, a: 'rgba(206,220,230,0.42)', b: 'rgba(0,0,0,0.62)' });
    D.hatch(ctx, x1 + 3, y, 10, h, { step: 6, a: 'rgba(206,220,230,0.42)', b: 'rgba(0,0,0,0.62)' });

    // corner brackets
    ctx.strokeStyle = 'rgba(226,238,246,0.5)';
    ctx.lineWidth = 2;
    var b = 16;
    [[x0 + 4, y + 4, 1, 1], [x1 - 4, y + 4, -1, 1],
     [x0 + 4, y + h - 4, 1, -1], [x1 - 4, y + h - 4, -1, -1]].forEach(function (c) {
      ctx.beginPath();
      ctx.moveTo(c[0] + c[2] * b, c[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(c[0], c[1] + c[3] * b);
      ctx.stroke();
    });

    // centre mark
    ctx.save();
    ctx.strokeStyle = 'rgba(226,238,246,0.28)';
    ctx.setLineDash([4, 8]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ZONE_MID, y + 6); ctx.lineTo(ZONE_MID, y + h - 6); ctx.stroke();
    ctx.restore();

    D.stencil(ctx, 'PRESS ZONE', ZONE_MID, y - 12,
      { size: 9, track: 3.4, align: 'center', color: 'rgba(180,194,205,0.55)' });
  }

  /* ---------- line 5 ----------
     Drawn in the plant's own grey. It gets no accent and no glow: it is a
     second job, not a discovery, and it has to compete with the press for
     the player's eye on nothing but its own movement. */

  function drawReturnLine(ctx, t, cfg, lit, phase) {
    var y = LAY.retY, h = LAY.retH;

    /* Hangers only. The first cut slung the conveyor from a solid band of
       steel, which blacked out the clerestory — the one source of daylight
       in the building — and turned the top third of the screen into a stack
       of horizontal bars. The roof stays visible; the belt hangs off it. */
    for (var hx = 70; hx < W; hx += 168) {
      ctx.fillStyle = 'rgba(6,9,10,0.9)';
      ctx.fillRect(hx, 0, 5, y);
      ctx.fillStyle = 'rgba(206,220,230,0.10)';
      ctx.fillRect(hx, 0, 1, y);
    }

    // travel is right to left, so the slats scroll the other way
    S.belt(ctx, 0, y, W, h, -phase);
    /* Lit at full whatever the hall is doing. This is a working area and
       the job is to see a difference in a shape; a shift 6 that hides the
       stock is not atmosphere, it is a broken control. */
    S.beltLight(ctx, LAY.retZoneX0 - 130, y, (LAY.retZoneX1 - LAY.retZoneX0) + 260,
      h, lit ? 1.5 : 1);

    /* The bench lamp, if it was bought. The hall's own lamps hang over the
       floor and light the press; nothing up here was ever lit on purpose. */
    if (lit) S.lamp(ctx, RET_MID, y - 58, 18, 104, y + h, 0.95, 1);

    // the inspection zone: a painted bay, hatched at the ends. Deliberately
    // not the press zone's language — no corner brackets, no centre mark.
    var x0 = LAY.retZoneX0, x1 = LAY.retZoneX1;
    ctx.save();
    ctx.beginPath(); ctx.rect(x0, y, x1 - x0, h); ctx.clip();
    ctx.fillStyle = 'rgba(214,228,238,0.10)';
    ctx.fillRect(x0, y, x1 - x0, h);
    ctx.restore();
    D.hatch(ctx, x0 - 11, y, 9, h, { step: 6, a: 'rgba(206,220,230,0.44)', b: 'rgba(0,0,0,0.62)' });
    D.hatch(ctx, x1 + 2, y, 9, h, { step: 6, a: 'rgba(206,220,230,0.44)', b: 'rgba(0,0,0,0.62)' });
    ctx.fillStyle = 'rgba(226,238,246,0.40)';
    ctx.fillRect(x0 - 2, y, 2, h);
    ctx.fillRect(x1, y, 2, h);
    ctx.fillStyle = 'rgba(206,220,230,0.28)';
    ctx.fillRect(x0, y + h - 2, x1 - x0, 2);
    ctx.fillRect(x0, y, x1 - x0, 1);

    D.stencil(ctx, C.RET_LINE, 22, y - 11, { size: 9, track: 3, color: 'rgba(130,142,152,0.75)' });
    D.stencil(ctx, C.RET_ZONE, RET_MID, y - 11,
      { size: 9, track: 3.4, align: 'center', color: 'rgba(170,184,195,0.7)' });
  }

  /* A piece on line 5. A fault sits canted in its seat and carries a split
     across the body — a shape difference and a bright line, because a dark
     mark on dark metal is not a tell, it is nothing. Neither the lamp nor
     the gauge makes a fault visible that was not; they make it take less
     looking, which is the whole of what forty-five and seventy scrip buy. */
  function drawReturn(ctx, r, t, kit) {
    var y = LAY.retPartY + r.bob;
    var faulty = r.faulty;

    S.widget(ctx, r.x, y, 1.05, r.form, faulty
      ? { hi: '#81868a', mid: '#494e52', lo: '#181a1c', rot: 0.32 }
      : { hi: '#8e9397', mid: '#52575b', lo: '#1a1c1e' });

    if (faulty) {
      // the split, raked by whatever light there is
      ctx.save();
      ctx.strokeStyle = 'rgba(232,242,249,' + (kit.lamp ? 0.62 : 0.34) + ')';
      ctx.lineWidth = kit.lamp ? 1.8 : 1.4;
      ctx.beginPath();
      ctx.moveTo(r.x - 13, y + 7);
      ctx.lineTo(r.x + 2, y - 4);
      ctx.lineTo(r.x + 15, y - 12);
      ctx.stroke();
      ctx.restore();
      if (kit.gauge) {
        /* The comparator's verdict, and the only thing on line 5 that is
           ever stated rather than shown. It is what seventy scrip buys. */
        ctx.fillStyle = 'rgba(226,238,246,0.85)';
        ctx.beginPath();
        ctx.moveTo(r.x, y - 24);
        ctx.lineTo(r.x + 6, y - 32);
        ctx.lineTo(r.x - 6, y - 32);
        ctx.closePath();
        ctx.fill();
      }
    }

    /* Something on it. A strip of red tape wrapped round the seat, which is
       how anybody marks a piece they want somebody else to look at, and the
       only red on a working screen. Click it and you read what is on it;
       click it again and it comes off the line like anything else. */
    if (r.clue) {
      /* Wrapped round the seat at an angle, the way tape goes on by hand.
         Drawn square to begin with, which read as a redaction bar — the
         wrong idea entirely, since nothing here is being hidden from the
         player. */
      ctx.save();
      ctx.translate(r.x, y);
      ctx.rotate(-0.42);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = P.markLo;
      ctx.fillRect(-3.5, -12, 7, 24);
      ctx.fillStyle = P.mark;
      ctx.fillRect(-3.5, -12, 5, 24);
      ctx.restore();
    }
  }

  /* The bay's own readout: one line, under the belt, on a seat dark enough
     to be read against whatever machine happens to be behind it. */
  function retSay(ctx, text, alpha, color) {
    var opt = { size: 9.5, track: 3 };
    var w = D.measure(ctx, text, opt) + 28;
    var y = LAY.retY + LAY.retH + 10;
    ctx.save();
    ctx.globalAlpha = D.clamp(alpha, 0, 1);
    ctx.fillStyle = 'rgba(5,7,8,0.82)';
    D.rrect(ctx, RET_MID - w / 2, y, w, 22, 2);
    ctx.fill();
    ctx.restore();
    D.stencil(ctx, text, RET_MID, y + 15,
      { size: 9.5, track: 3, align: 'center', color: color, alpha: alpha });
  }

  /* ---------- the bin ----------
     A wire basket at the end of the bench. It is on screen from the first
     shift, it is never highlighted, and the only thing that ever tells the
     player it matters is the foreman's line on the first brief: empty it
     before you clock off and there are a couple of scrip in it.

     It used to be a screen of its own after the hooter, with a man
     explaining that sorting it was pointless. That explained the joke
     before the player had heard it. Now it is a bin in the corner, and
     what is in it is what is in it. */
  /* Between the finished-stock tray and the station plate. It sat at x=92
     to begin with, directly on top of the tray, and read as a basket
     balanced on a shelf. */
  var BIN = { x: 330, w: 112, y: LAY.apronY + 26, h: 54 };

  function drawBin(ctx, sorted, hover) {
    var x = BIN.x, y = BIN.y, w = BIN.w, h = BIN.h;
    // the basket: a tapered wire thing, seen from slightly above
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w - 13, y + h);
    ctx.lineTo(x + 13, y + h);
    ctx.closePath();
    var bg = ctx.createLinearGradient(0, y, 0, y + h);
    bg.addColorStop(0, hover ? '#2a2f33' : '#20252a');
    bg.addColorStop(1, '#0f1214');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = hover ? 'rgba(206,220,230,0.34)' : 'rgba(206,220,230,0.16)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    // mesh
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(206,220,230,0.10)';
    ctx.lineWidth = 1;
    for (var i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 8 + i * 16, y);
      ctx.lineTo(x + 16 + i * 14, y + h);
      ctx.stroke();
    }
    for (var j = 1; j < 3; j++) {
      ctx.beginPath();
      ctx.moveTo(x + j * 3, y + j * (h / 3));
      ctx.lineTo(x + w - j * 3, y + j * (h / 3));
      ctx.stroke();
    }
    ctx.restore();

    if (!sorted) {
      // what is in it: paper, and the swarf underneath
      ctx.fillStyle = 'rgba(150,146,136,0.30)';
      ctx.beginPath(); ctx.arc(x + 34, y + 12, 9, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 58, y + 8, 11, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 82, y + 13, 8, 0, 6.3); ctx.fill();
      ctx.fillStyle = 'rgba(120,128,134,0.35)';
      ctx.fillRect(x + 22, y + 20, 70, 5);
    }
    ctx.restore();

    D.stencil(ctx, sorted ? C.BIN_DONE : C.BIN_LABEL, x, y + h + 15,
      { size: 8.5, track: 2, color: sorted ? 'rgba(104,112,119,0.9)' : P.faint });
  }

  /* The sorting window. Six things in the basket; each goes in one of two
     places and it does not matter which, because they both go to the same
     skip. One of them has a red mark on it. */
  var SORT = { x: 268, w: W - 536, top: 100, row: 118 };

  /* The operator's own station: the foreground band you stand behind. */
  function drawApron(ctx, sh) {
    var y = LAY.apronY;
    D.vgrad(ctx, 0, y, W, H - y, '#2a2e30', '#161818');
    D.hatch(ctx, 0, y, W, 11, { step: 13, a: '#2f3336', b: '#1c1e20' });
    ctx.fillStyle = 'rgba(226,238,246,0.14)';
    ctx.fillRect(0, y, W, 1.5);
    D.seam(ctx, 0, y + 11, W, { alpha: 0.9 });

    // finished tray, left
    D.plate(ctx, 60, y + 30, 240, 46, { top: '#1e2022', bot: '#171818', r: 2 });
    D.stencil(ctx, 'FINISHED STOCK', 76, y + 56, { size: 9.5, track: 2.6, color: P.faint });

    // station mark, centre
    D.stencil(ctx, 'STATION 4-C', ZONE_MID, y + 44,
      { size: 11, track: 4.5, align: 'center', color: 'rgba(120,132,142,0.7)' });
    ctx.fillStyle = 'rgba(226,238,246,0.10)';
    ctx.fillRect(ZONE_MID - 90, y + 54, 180, 1);

    // scrap chute, right — only cut once it exists
    if (sh && sh.n >= L.SCRAP_FROM_SHIFT) {
      var cx = W - 300;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, y + 30); ctx.lineTo(cx + 240, y + 30);
      ctx.lineTo(cx + 216, y + 78); ctx.lineTo(cx + 24, y + 78);
      ctx.closePath();
      var cg = ctx.createLinearGradient(0, y + 30, 0, y + 78);
      cg.addColorStop(0, '#141617');
      cg.addColorStop(1, '#0e1112');
      ctx.fillStyle = cg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(226,238,246,0.16)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
      D.stencil(ctx, 'SCRAP', cx + 120, y + 22,
        { size: 9.5, track: 3, align: 'center', color: P.faint });
    }
  }

  /* ---------- the station's own controls ----------
     Deliberately grey. The accent is reserved for inquiry, and neither of
     these is a discovery — they are fittings on a machine, and they look
     like every other fitting until you have a reason to touch them. */

  /* Set flush with the finished-stock tray so the apron reads as one bench
     of fittings rather than three things at three heights. */
  var SW = {
    stop:  { x: 716, y: LAY.apronY + 30, w: 170, h: 46, id: 'stop' }
  };

  /* Somewhere for a line to be said that is not about a control. Line 5 has
     no switch of its own — it is just work that goes past. */
  var ANCH = {
    line5: { x: LAY.retZoneX0, y: LAY.retY - 20 },
    dock:  { x: W - 232, y: 300 }
  };

  function drawSwitch(ctx, r, label, value, o) {
    o = o || {};
    var thrown = !!o.thrown, hover = !!o.hover, dead = !!o.dead;

    D.plate(ctx, r.x, r.y, r.w, r.h, { top: '#363a3d', bot: '#181a1c', r: 2 });
    ctx.fillStyle = 'rgba(226,238,246,' + (hover && !dead ? 0.20 : 0.10) + ')';
    ctx.fillRect(r.x + 1, r.y, r.w - 2, 1.5);
    D.rivet(ctx, r.x + 7, r.y + 8, 2);
    D.rivet(ctx, r.x + r.w - 7, r.y + 8, 2);

    D.stencil(ctx, label, r.x + 11, r.y + 16,
      { size: 8.5, track: 2.4, color: 'rgba(140,152,162,0.85)' });

    // two-position travel: which end of its slot the lever is sitting at
    var sx = r.x + 10, sw = r.w - 20;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(sx, r.y + 21, sw, 3);
    ctx.fillStyle = 'rgba(226,238,246,' + (thrown ? 0.55 : 0.24) + ')';
    ctx.fillRect(thrown ? sx + sw / 2 : sx, r.y + 21, sw / 2, 3);

    // the position, lettered
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(sx, r.y + 27, sw, 15);
    D.stencil(ctx, value, r.x + r.w / 2, r.y + 39,
      { size: 11, track: 3, align: 'center',
        color: thrown ? P.bright : 'rgba(120,132,142,0.9)' });

    /* An armed stop is on a timer, and a control that quietly disarms
       itself without saying so is a trap. The window is drawn. */
    if (o.arm > 0) {
      ctx.fillStyle = 'rgba(226,238,246,0.62)';
      ctx.fillRect(r.x + 2, r.y + 2, (r.w - 4) * D.clamp(o.arm, 0, 1), 2);
    }

    // fitted, lettered, and not yours: a dead plate reads as dead
    if (dead) {
      ctx.fillStyle = 'rgba(5,7,8,0.74)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
  }

  /* ---------- parts ---------- */

  function drawPart(ctx, p, t) {
    var lit = 1 - Math.min(1, Math.abs(p.x - ZONE_MID) / 420);
    var o = p.stamped
      ? { hi: '#494e52', mid: '#2a2e31', lo: '#0e1011' }
      : { hi: '#767c81', mid: '#454a4e', lo: '#181a1c' };
    S.widget(ctx, p.x, LAY.partY + p.bob, 1.2, p.form, o);

    if (p.stamped) {
      // a struck mark: two short bars, unreadable, official-looking
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = 'rgba(226,236,243,0.55)';
      ctx.fillRect(p.x - 11, LAY.partY + p.bob - 3, 22, 2);
      ctx.fillRect(p.x - 7, LAY.partY + p.bob + 3, 14, 2);
      ctx.restore();
    }
    if (lit > 0.02 && !p.stamped) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var g = ctx.createRadialGradient(p.x, LAY.partY, 2, p.x, LAY.partY, 48);
      g.addColorStop(0, 'rgba(196,212,224,' + (0.07 * lit) + ')');
      g.addColorStop(1, 'rgba(196,212,224,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, LAY.partY, 48, 0, 6.3); ctx.fill();
      ctx.restore();
    }
  }

  /* ---------- what there is to find ----------

     There used to be an amber crate here: a lit box that rode the belt with
     a pulsing tag on it and the word OPEN over its head, plus a lamp on the
     console when one was due. It was the only colour in the build and it
     was, in effect, the game putting its finger on the page.

     Nothing marks itself now. What there is to find rides in on the ordinary
     channels of a working shift — a faulty piece that has been got at, a
     radio nobody bought for this, a camera pointed at a yard, a bin. The
     accent survives only on the reading surface itself, once you are already
     holding the thing. */

  /* How long each kind of flash has to say what it is. */
  var FLASH_SPAN = {
    stamp: 0.30, scrap: 0.45, gone: 0.45,
    pull: 0.9, pullgood: 0.9, swept: 0.4, reject: 1.4,
    look: 1.1, nothing: 1.1
  };

  /* The yard camera, if it was bought: a monitor bracketed to the wall at
     the end of the bench. It sat up beside the console to begin with, where
     it covered the end of line 5 and put its own label across the belt, and
     where it had to fight the production readouts for room. Down here it is
     out of the way of everything and in a third direction from the press,
     which is the point of it — one more place a pair of eyes has to be. */
  var DOCK = { x: W - 232, y: 306, w: 196, h: 104 };

  function drawDock(ctx, t, has, hover) {
    D.plate(ctx, DOCK.x - 8, DOCK.y - 8, DOCK.w + 16, DOCK.h + 32,
      { top: '#373c3f', bot: '#1c1e20', r: 2 });
    D.rivetsAround(ctx, DOCK.x - 8, DOCK.y - 8, DOCK.w + 16, DOCK.h + 32, 8, 2.2);

    ctx.save();
    ctx.beginPath(); ctx.rect(DOCK.x, DOCK.y, DOCK.w, DOCK.h); ctx.clip();

    /* The yard at night, from above the dock: a strip of sky, a wall, a
       lamp over the gate, and the apron in front of it. Everything in the
       picture is a silhouette against the one light, so a shape that is
       not usually there reads as a shape and never as an insignia. */
    var horizon = DOCK.y + DOCK.h * 0.46;
    D.vgrad(ctx, DOCK.x, DOCK.y, DOCK.w, horizon - DOCK.y, '#1d2021', '#2c2f32');
    D.vgrad(ctx, DOCK.x, horizon, DOCK.w, DOCK.y + DOCK.h - horizon, '#272a2d', '#090b0c');

    // the lamp over the gate, and the pool it throws on the apron
    var lx = DOCK.x + DOCK.w * 0.74, ly = horizon - 30;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    var lg = ctx.createRadialGradient(lx, ly, 1, lx, ly, 78);
    lg.addColorStop(0, 'rgba(196,212,224,0.34)');
    lg.addColorStop(1, 'rgba(196,212,224,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(lx, ly, 78, 0, 6.3); ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(226,238,246,0.75)';
    ctx.fillRect(lx - 2, ly - 2, 4, 4);

    // the yard wall and the gate in it, flat black against the sky
    ctx.fillStyle = '#05070800';
    ctx.fillStyle = 'rgba(3,5,6,0.95)';
    ctx.fillRect(DOCK.x, horizon - 22, DOCK.w, 22);
    ctx.fillRect(DOCK.x + DOCK.w - 44, horizon - 40, 40, 40);

    if (has) {
      /* A lorry backed up to the dock, a tarpaulin roped over the bed, two
         men working the straps, and a pennant on the wing. The device on
         the pennant is behind a fold of the tarpaulin the whole time it is
         in frame: there is no insignia anywhere in this build, only the
         fact that one is being kept out of the light. */
      var bx = DOCK.x + 16, by = horizon - 34;
      ctx.fillStyle = 'rgba(2,3,4,0.98)';
      ctx.fillRect(bx, by + 6, 96, 28);          // covered bed
      ctx.fillRect(bx + 96, by + 14, 30, 20);    // cab
      ctx.beginPath();                            // wheels
      ctx.arc(bx + 22, by + 34, 6, 0, 6.3);
      ctx.arc(bx + 78, by + 34, 6, 0, 6.3);
      ctx.arc(bx + 116, by + 34, 6, 0, 6.3);
      ctx.fill();
      // the tarpaulin: slack, roped, catching the gate lamp along the ridge
      ctx.strokeStyle = 'rgba(196,212,224,0.30)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(bx + 2, by + 12);
      ctx.lineTo(bx + 34, by + 6);
      ctx.lineTo(bx + 68, by + 11);
      ctx.lineTo(bx + 94, by + 8);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(150,166,178,0.18)';
      ctx.lineWidth = 1;
      for (var rp = 0; rp < 4; rp++) {
        ctx.beginPath();
        ctx.moveTo(bx + 12 + rp * 24, by + 8);
        ctx.lineTo(bx + 12 + rp * 24, by + 32);
        ctx.stroke();
      }

      // the pennant on the wing, and the fold that is across it
      var px2 = bx + 126, py2 = by + 6;
      ctx.fillStyle = 'rgba(3,5,6,0.9)';
      ctx.fillRect(px2, py2 - 4, 1.5, 16);
      ctx.fillStyle = 'rgba(140,155,167,0.55)';
      ctx.beginPath();
      ctx.moveTo(px2 + 1, py2 - 3);
      ctx.lineTo(px2 + 20, py2 + 3);
      ctx.lineTo(px2 + 1, py2 + 9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(2,3,4,0.94)';
      ctx.fillRect(px2 + 5, py2 - 5, 9, 17);

      // headlamps on, throwing across the apron: the change in the picture
      // has to be visible from the press, not only when looked at
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var hg = ctx.createRadialGradient(bx + 132, by + 24, 2, bx + 132, by + 24, 62);
      hg.addColorStop(0, 'rgba(214,228,238,0.40)');
      hg.addColorStop(1, 'rgba(214,228,238,0)');
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(bx + 132, by + 24, 62, 0, 6.3); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(232,242,249,0.85)';
      ctx.fillRect(bx + 128, by + 20, 4, 4);

      // two men at the straps, working, lit down one side by the gate lamp
      var sway = Math.sin(t * 1.6) * 2;
      [[bx - 14, sway], [bx - 28, -sway]].forEach(function (m) {
        ctx.fillStyle = 'rgba(1,2,3,1)';
        ctx.fillRect(m[0], by + 14 + m[1], 6, 20);
        ctx.beginPath(); ctx.arc(m[0] + 3, by + 11 + m[1], 3.4, 0, 6.3); ctx.fill();
        ctx.fillStyle = 'rgba(196,212,224,0.16)';
        ctx.fillRect(m[0] + 5, by + 14 + m[1], 1, 20);
      });
    }

    // tube: scanlines and a slow band, so it reads as a picture of a place
    ctx.fillStyle = 'rgba(0,0,0,0.24)';
    for (var sy = DOCK.y; sy < DOCK.y + DOCK.h; sy += 3) {
      ctx.fillRect(DOCK.x, sy, DOCK.w, 1);
    }
    ctx.fillStyle = 'rgba(206,220,230,0.035)';
    ctx.fillRect(DOCK.x, DOCK.y + ((t * 26) % (DOCK.h + 40)) - 20, DOCK.w, 18);
    ctx.restore();

    // bezel
    /* With something in it the bezel takes a slow pulse and the label says
       so. This is the one instrument in the build allowed to ask for
       attention, and it is allowed because the player paid for it. */
    var live = has ? 0.5 + 0.5 * Math.sin(t * 2.2) : 0;
    ctx.strokeStyle = hover ? 'rgba(206,220,230,0.42)'
      : (has ? 'rgba(206,220,230,' + (0.24 + 0.30 * live) + ')' : 'rgba(0,0,0,0.85)');
    ctx.lineWidth = has ? 2 : 1.5;
    ctx.strokeRect(DOCK.x + 0.5, DOCK.y + 0.5, DOCK.w - 1, DOCK.h - 1);
    D.stencil(ctx, has ? C.DOCK_ALERT : C.DOCK_LABEL, DOCK.x, DOCK.y + DOCK.h + 15,
      { size: 8, track: 1.8, color: has ? P.text : P.faint });
    if (has) {
      D.stencil(ctx, C.DOCK_HINT, DOCK.x + DOCK.w, DOCK.y + DOCK.h + 15,
        { size: 8, track: 1.8, color: P.dim, align: 'right' });
    }
  }

  /* ---------- screen ---------- */

  var Shift = Screens.shift = {
    name: 'shift',
    shift: null,
    parts: [],
    nextId: 0,
    spawnT: 0,
    lineRate: 1,     // 0..1, how fast the whole line is running just now
    beltPhase: 0,    // travelled distance, so the belt can slow with it
    retPhase: 0,
    ram: 0,          // 0 = up, 1 = struck
    ramPhase: null,  // 'down' | 'hold' | 'up' | null
    ramT: 0,
    flashes: [],
    hits: [],
    lastAction: null,
    carry: null,     // a part-channel clue waiting for a fault to ride in on
    carryQ: [],      // the rest of them, in schedule order
    dockQ: [],       // yard-camera items, in schedule order
    dockUp: null,    // the one currently in frame, if any
    radioQ: [],      // bench-set items, in schedule order
    ambient: null,   // { clue, t, shown, read } playing over the noise
    filler: 0,       // index into the radio's ordinary programme
    fillerT: 0,
    open: null,      // { clue, t, shown, read } while an item is being read
    run: null,       // the run this shift belongs to
    stopArm: 0,      // seconds left on an armed master stop
    notice: null,    // { text, t, at } — a line said at the station, briefly
    pendingSay: null,// a line waiting for the belt to be visible again
    charge: 1,       // the press cycle, 0..1; it will not strike below 1
    welcomed: false, // the first-shift nudge has been given
    returns: [],     // pieces currently on line 5
    retSpawnT: 0,
    retIdx: 0,       // how many have been released this shift
    faultIdx: 0,     // how many of those were faults, for the arm's share
    kit: null,       // what is on the bench this shift, resolved once
    bin: null,       // the sorting window, while it is open
    binDone: false,  // the basket has been emptied this shift

    enter: function (opts, g) {
      var n = (g.run && g.run.shift) || 1;
      this.shift = L.newShift(n, g.run);
      this.run = g.run;
      this.parts = [];
      this.nextId = 0;
      this.spawnT = 0.6;
      this.lineRate = 1;
      this.beltPhase = 0;
      this.retPhase = 0;
      this.returns = [];
      this.retSpawnT = 1.0;
      this.retIdx = 0;
      this.faultIdx = 0;
      this.bin = null;
      this.binDone = false;
      /* Resolved once per shift rather than looked up per frame: what you
         walked onto the floor with is what you have for the next hour. */
      var led = g.run && g.run.ledger;
      this.kit = {
        lamp: E.owns(led, 'lamp'),
        gauge: E.owns(led, 'gauge'),
        arm: E.owns(led, 'arm'),
        feeder: E.owns(led, 'feeder'),
        radio: E.owns(led, 'radio'),
        dock: E.owns(led, 'camera')
      };
      this.ram = 0; this.ramPhase = null; this.ramT = 0;
      this.flashes = [];
      this.lastAction = null;
      this.open = null;
      this.stopArm = 0;
      this.notice = null;
      this.pendingSay = null;
      this.charge = 1;
      this.welcomed = n !== 1;
      if (n === 1) this.pendingSay = { text: C.LINE_FIVE, secs: 5.0, at: 'line5' };
      var cfg = this.shift.cfg;

      /* One queue per channel, each in its own schedule order. A channel
         nobody bought is loaded anyway and simply never opened — the shift
         counts what it put within reach whether or not you had the set to
         hear it, because that is what you did not buy. */
      function due(list) {
        return list.map(function (c) { return { clue: c, at: c.at * cfg.duration }; })
          .sort(function (a, b) { return a.at - b.at; });
      }
      this.carryQ = due(L.cluesVia(n, 'part'));
      this.dockQ = due(L.cluesVia(n, 'dock'));
      this.radioQ = due(L.cluesVia(n, 'radio'));
      this.carry = null;
      this.dockUp = null;
      this.ambient = null;
      this.filler = n * 3;
      this.fillerT = 4.0;
      /* The bin at the end of the shift is not scheduled here — it is
         whatever is left over when the hooter goes, and the trash screen
         asks logic for it then. */
      this.shift.marksSeen =
        this.carryQ.length + this.dockQ.length + this.radioQ.length
        + L.trashFor(g.run, this.shift).length;
      /* Whatever is in the basket and never looked at is written off at the
         hooter, exactly as an unread piece on line 5 is. */
      this.binLeft = L.trashFor(g.run, this.shift).length;
      SOL.audio.lineOn && SOL.audio.lineOn();
    },

    leave: function () {
      SOL.audio.lineOff && SOL.audio.lineOff();
    },

    /* ----- simulation ----- */

    update: function (dt, g) {
      var sh = this.shift;
      if (!sh || sh.over) return;

      var cfg = sh.cfg;
      var reading = !!this.open || !!this.bin;

      /* Reading throttles the line down to a crawl. It is not a fiction —
         no factory slows for a man reading a docket — it is the game giving
         you room, and it is eased in and out rather than snapped so it
         reads as deliberate rather than as a stall.

         The clock is deliberately *not* slowed, and that is where the cost
         of looking now lives: the shift burns at full speed while the line
         is barely moving, so a minute spent reading is a minute of parts
         you never got the chance to stamp. Before this the belt ran at
         full speed and the text was genuinely hard to read; the cost was
         real but it was being charged for the wrong thing. */
      var want = reading ? L.READ_SLOWDOWN : 1;
      this.lineRate += (want - this.lineRate) * Math.min(1, dt / 0.22);
      var rate = this.lineRate;
      var ldt = dt * rate;

      sh.timeLeft -= dt;
      if (this.open) sh.readSecs += dt;
      if (sh.timeLeft <= 0) {
        sh.timeLeft = 0;
        // a basket nobody got to is a thing nobody found
        if (!this.binDone) sh.marksPassed += this.binLeft;
        this.endShift(g);
        return;
      }
      var elapsed = cfg.duration - sh.timeLeft;

      // arrivals
      this.spawnT -= ldt;
      while (this.spawnT <= 0) {
        this.spawn();
        this.spawnT += cfg.spawn;
      }

      /* Something to find on line 5. It waits for a fault to ride in and
         goes out on that — so the piece carrying it is a piece you had a
         reason to touch anyway, and the choice is only ever whether to
         take it off or turn it over first. */
      if (!this.carry && this.carryQ.length && this.carryQ[0].at <= elapsed) {
        this.carry = this.carryQ.shift().clue;
      }

      this.beltPhase += cfg.speed * ldt;

      var keep = [];
      for (var i = 0; i < this.parts.length; i++) {
        var p = this.parts[i];
        p.x += cfg.speed * ldt;
        // A part is lost the moment it clears the press, not when it
        // finally leaves the frame — so the cost of reading is charged
        // while you are still reading, which is the whole point of it.
        if (!p.stamped && !p.escaped && p.x > LAY.zoneX1) {
          p.escaped = true;
          if (reading) sh.lostToInquiry++;
        }
        if (p.x >= LAY.exitX) {
          if (!p.stamped) sh.missed++;
        } else {
          keep.push(p);
        }
      }
      this.parts = keep;

      /* Line 5. Nothing is released inside L.RETURN_LEAD of the hooter, so
         every piece a shift brings is one you either took off or did not —
         there is no stock left in front of you when the clock stops. */
      this.retPhase += LAY.retSpeed * ldt;
      var due = L.returnCount(cfg);
      if (this.retIdx < due) {
        this.retSpawnT -= ldt;
        while (this.retSpawnT <= 0 && this.retIdx < due) {
          this.spawnReturn(cfg);
          this.retSpawnT += cfg.ret;
        }
      }

      var rkeep = [];
      for (var k = 0; k < this.returns.length; k++) {
        var r = this.returns[k];
        r.x -= LAY.retSpeed * ldt;
        /* The arm reaches in at the head of the zone and takes the ones
           anybody would catch, before they are yours to miss. It costs you
           nothing, which is what a hundred and fifty scrip is for. */
        if (r.faulty && this.kit.arm && r.armable && r.x <= LAY.retZoneX1) {
          sh.pulled++; sh.pulledFaulty++; sh.sweptByArm++;
          this.flashes.push({ t: 0.4, x: r.x, y: LAY.retPartY, kind: 'swept' });
          continue;
        }
        if (!r.past && r.x <= LAY.retZoneX0 - 24) {
          r.past = true;
          if (r.faulty) {
            // fitted at the assembly works, found there, charged to you
            sh.rejects++;
            this.flashes.push({ t: 1.4, x: LAY.retZoneX0 - 24, y: LAY.retPartY, kind: 'reject' });
          }
          /* Whatever was on it goes out of the building on it. There is no
             second chance and no notice that there was a first one. */
          if (r.clue) { sh.marksPassed++; r.clue = null; }
        }
        if (r.x > LAY.retExitX) rkeep.push(r);
      }
      this.returns = rkeep;

      /* The yard camera. The picture changes and nothing else happens; a
         player working the press flat out will not see that it has. */
      if (!this.dockUp && this.dockQ.length && this.dockQ[0].at <= elapsed) {
        this.dockUp = this.dockQ.shift().clue;
        this.dockT = 0;
        /* Said once, beside the monitor, if the monitor is on the bench.
           A player who paid for the camera is told there is something to
           look at; a player who did not is told nothing, because there is
           nothing on their bench to tell them. */
        if (this.kit.dock) {
          this.pendingSay = { text: C.DOCK_ALERT, secs: 6.0, at: 'dock' };
        }
      }
      if (this.dockUp) {
        this.dockT += dt;
        // the lorry is loaded and gone, whether or not anybody looked
        if (this.dockT > L.DOCK_WINDOW) {
          if (!this.open || this.open.clue !== this.dockUp) sh.marksPassed++;
          this.dockUp = null;
        }
      }

      // the bench set, if there is one, talking over the noise
      if (this.kit.radio) this.updateRadio(dt, elapsed, g);
      else while (this.radioQ.length && this.radioQ[0].at <= elapsed) {
        // it went out on a band nobody at this bench was listening to
        this.radioQ.shift();
        sh.marksPassed++;
      }

      /* The feeder works its own share of line 4 and does not touch the
         cycle you are waiting on — it is a second pair of hands, which is
         exactly what it costs. */
      if (this.kit.feeder) {
        for (var a = 0; a < this.parts.length; a++) {
          var q = this.parts[a];
          if (q.auto && !q.stamped && q.x >= ZONE_MID) this.autoStamp(q);
        }
      }

      /* The press recharges whatever else is happening — including while an
         item is open, so reading never costs you a strike you would have
         had. What reading costs is parts, and it is charged above. */
      if (this.charge < 1) {
        this.charge = Math.min(1, this.charge + dt / E.cycle(g.run && g.run.ledger));
      }

      /* Permission to look round, given once, early, on the slow shift, and
         phrased as a fact about the machine rather than as advice. */
      if (!this.welcomed && elapsed > 5.5) {
        this.welcomed = true;
        this.pendingSay = { text: C.LOOK_ROUND, secs: 6.0, at: 'stop' };
      }

      /* `reading` also covers the basket being open, which throttles the
         line the same way — but there is nothing to page through in a
         basket, and updateReading walks this.open unguarded. */
      if (this.open) this.updateReading(dt, g);

      /* What a player can do about it once they know is said on the brief
         when they clock on, not at the station — see flow.js. There is
         nothing here to unlock and no new control to notice: the three
         things that withhold work are the three they were already doing. */
      if (this.pendingSay && !this.open) {
        this.say(this.pendingSay.text, this.pendingSay.secs, this.pendingSay.at);
        this.pendingSay = null;
      }

      if (this.stopArm > 0) this.stopArm = Math.max(0, this.stopArm - dt);
      if (this.notice) {
        this.notice.t -= dt;
        if (this.notice.t <= 0) this.notice = null;
      }

      this.updateAnim(dt);
    },

    /* One line said at the station, anchored to the control it is about
       so the player's eye is already in the right place. */
    say: function (text, secs, at) {
      this.notice = { text: text, t: secs || 2.6, at: at || 'stop' };
    },

    /* The bench set. It talks whether or not there is anything to hear, and
       the lines that matter are read out in exactly the voice of the ones
       that do not. There is no cost to listening and no way to pause it:
       either you were reading the bottom of the screen while you worked or
       you were not. Sixty scrip and your own attention. */
    updateRadio: function (dt, elapsed, g) {
      if (this.ambient) {
        var o = this.ambient;
        o.t += dt;
        var shown = Math.min(o.clue.lines.length,
          Math.floor(o.t / L.RADIO_LINE) + 1);
        if (shown > o.shown) { o.shown = shown; SOL.audio.radio(); }
        if (!o.read && o.t >= o.clue.lines.length * L.RADIO_LINE) {
          o.read = true;
          L.recordClue(g.run, this.shift, o.clue);
        }
        if (o.t >= o.clue.lines.length * L.RADIO_LINE + 1.4) this.ambient = null;
        return;
      }
      if (this.radioQ.length && this.radioQ[0].at <= elapsed) {
        this.ambient = { clue: this.radioQ.shift().clue, t: 0, shown: 0, read: false };
        return;
      }
      this.fillerT -= dt;
      if (this.fillerT <= 0) {
        this.filler++;
        this.fillerT = L.RADIO_LINE + 1.2;
      }
    },

    radioText: function () {
      if (!this.kit || !this.kit.radio) return null;
      if (this.ambient && this.ambient.shown > 0) {
        return this.ambient.clue.lines[this.ambient.shown - 1];
      }
      var f = C.RADIO_FILLER;
      return f[((this.filler % f.length) + f.length) % f.length];
    },

    /* Reading is timed: lines surface one at a time and the item only
       counts once the last one has. Closing early puts it back unread. */
    updateReading: function (dt, g) {
      var o = this.open;
      o.t += dt;
      var shown = L.linesShown(o.clue, o.t);
      if (shown > o.shown) {
        o.shown = shown;
        SOL.audio.reveal && SOL.audio.reveal();
      }
      if (!o.read && L.isRead(o.clue, o.t)) {
        o.read = true;
        L.recordClue(g.run, this.shift, o.clue);
      }
    },

    updateAnim: function (dt) {
      // ram
      if (this.ramPhase === 'down') {
        this.ramT += dt / 0.10;
        if (this.ramT >= 1) { this.ramT = 0; this.ramPhase = 'hold'; this.ram = 1; }
        else this.ram = D.easeOut(this.ramT);
      } else if (this.ramPhase === 'hold') {
        this.ramT += dt / 0.05;
        if (this.ramT >= 1) { this.ramT = 0; this.ramPhase = 'up'; }
      } else if (this.ramPhase === 'up') {
        this.ramT += dt / 0.26;
        if (this.ramT >= 1) { this.ramT = 0; this.ramPhase = null; this.ram = 0; }
        else this.ram = 1 - D.easeOut(this.ramT);
      }
      // flashes
      var f = [];
      for (var i = 0; i < this.flashes.length; i++) {
        this.flashes[i].t -= dt;
        if (this.flashes[i].t > 0) f.push(this.flashes[i]);
      }
      this.flashes = f;
    },

    spawn: function () {
      var id = this.shift.spawned++;
      /* Which arrivals the feeder would take is settled here whether or not
         one is fitted, so the same shift plays the same way with and
         without it and the two runs can be compared. */
      var share = E.FEEDER_SHARE;
      this.parts.push({
        id: id,
        x: LAY.spawnX,
        form: S.FORMS[Math.floor(D.rnd(id * 1.37 + this.shift.n) * S.FORMS.length) % S.FORMS.length],
        bob: (D.rnd(id * 4.1) - 0.5) * 5,
        auto: Math.floor((id + 1) * share) > Math.floor(id * share),
        stamped: false,
      });
      this.nextId = id + 1;
    },

    spawnReturn: function (cfg) {
      var i = this.retIdx++;
      var faulty = L.isFaulty(i, cfg);
      var armable = false;
      if (faulty) {
        armable = L.armTakes(this.faultIdx, E.ARM_SHARE);
        this.faultIdx++;
        this.shift.faulty++;
      }
      /* A piece with something on it carries red tape, and that is the
         whole signal — it does not have to be faulty as well.

         It used to require a fault to ride on, back when there was one
         part-borne item a shift. With the tips in, shift 1 has two of them
         and exactly one fault on the whole line, so the second could never
         appear at all. Tape and fault are separate things now: crooked and
         split means it will not pass, red tape means somebody wants it
         looked at, and a piece can be either, both or neither.

         The arm never takes a taped piece. A machine that sorts by the
         obvious would have put it straight in the skip. */
      var clue = null;
      if (this.carry) {
        clue = this.carry;
        this.carry = null;
        armable = false;
      }
      this.shift.returns++;
      this.returns.push({
        i: i,
        x: LAY.retSpawnX,
        form: S.FORMS[Math.floor(D.rnd(i * 2.11 + this.shift.n * 7) * S.FORMS.length) % S.FORMS.length],
        bob: (D.rnd(i * 3.3 + 1.9) - 0.5) * 4,
        faulty: faulty,
        armable: armable,
        clue: clue,
        past: false
      });
    },

    /* The feeder's strike. Deliberately not routed through stamp(): it does
       not consume the cycle, it cannot be blocked by your hands being on
       line 5, and it never short-strikes. */
    autoStamp: function (p) {
      p.stamped = true;
      this.shift.stamped++;
      this.shift.autoStamped++;
      this.strike(1);
      this.flashes.push({ t: 0.22, x: p.x, kind: 'stamp' });
      SOL.audio.stampAuto();
    },

    /* ----- player actions ----- */

    inZone: function (p) { return p.x >= LAY.zoneX0 && p.x <= LAY.zoneX1; },

    /* Open an item for reading. The line does not stop and nothing is
       taken off it, so whatever this cost, it is still costing. */
    read_: function (clue) {
      if (!clue || this.open) return false;
      this.open = { clue: clue, t: 0, shown: 0, read: false };
      this.lastAction = 'open';
      SOL.audio.paper && SOL.audio.paper();
      return true;
    },

    /* Closing is not a decision point: whether it counted was settled the
       moment the last line surfaced (or didn't). */
    closeInquiry: function () {
      if (!this.open) return false;
      var wasRead = this.open.read;
      this.open = null;
      this.lastAction = wasRead ? 'read' : 'unread';
      SOL.audio.paper && SOL.audio.paper();
      return wasRead;
    },

    /* ----- the bin ----- */

    /* Six things, in the order they are lying in the basket. Which one has
       the mark on it is settled here rather than on the click, so it cannot
       depend on where the player happened to reach first. */
    openBin: function (g) {
      if (this.bin || this.binDone || this.open) return false;
      /* Everything the basket has for this shift, not just the first thing
         in it. A shift can put two papers in there — a tip and something
         else — and handing over only one meant the second was unreachable
         for the whole run. */
      var found = L.trashFor(g.run, this.shift);
      var n = C.BIN_ITEMS.length;
      var items = [];
      for (var i = 0; i < n; i++) {
        items.push({
          i: i,
          kind: C.BIN_ITEMS[i].kind,
          label: C.BIN_ITEMS[i].label,
          marked: false,
          clue: null,
          gone: false
        });
      }
      // spread the marks over the paper, starting from a per-shift offset
      var paper = items.filter(function (it) { return it.kind === 'paper'; });
      found.forEach(function (clue, k) {
        var slot = paper[(this.shift.n + k) % paper.length];
        if (!slot || slot.marked) slot = paper[k % paper.length];
        slot.marked = true;
        slot.clue = clue;
      }, this);
      this.bin = { items: items, found: found.slice(), left: n };
      SOL.audio.paper && SOL.audio.paper();
      return true;
    },

    /* One item into one of the two bins. Both are the same skip and the
       game never says which was right, because there is no right. */
    sortItem: function (idx, g) {
      var b = this.bin;
      if (!b) return false;
      var it = b.items[idx];
      if (!it || it.gone) return false;
      if (it.clue) {
        var clue = it.clue;
        it.clue = null;
        it.gone = true;
        b.left--;
        b.found = b.found.filter(function (c) { return c !== clue; });
        this.shift.looked++;
        this.read_(clue);
        if (b.left <= 0) this.closeBin(g);
        return true;
      }
      it.gone = true;
      b.left--;
      SOL.audio.turn && SOL.audio.turn();
      if (b.left <= 0) this.closeBin(g);
      return true;
    },

    closeBin: function (g) {
      if (!this.bin) return false;
      var cleared = this.bin.left <= 0;
      /* Whatever was in it and was not looked at goes in the skip with
         everything else, and nothing anywhere records that it was there. */
      this.shift.marksPassed += this.bin.found.length;
      this.bin = null;
      if (cleared) {
        this.binDone = true;
        this.shift.trashSorted = true;
        this.shift.binScrip = E.BIN_SCRIP;
        SOL.audio.lever && SOL.audio.lever();
      }
      return cleared;
    },

    /* ----- line 5 ----- */

    inRetZone: function (r) {
      return !r.past && r.x >= LAY.retZoneX0 && r.x <= LAY.retZoneX1;
    },

    returnAt: function (x) {
      for (var i = 0; i < this.returns.length; i++) {
        var r = this.returns[i];
        if (this.inRetZone(r) && Math.abs(r.x - x) <= 42) return r;
      }
      return null;
    },

    /* The nearest piece in the bay that has something on it. Only used by
       the keyboard fallback; the mark is meant to be clicked. */
    nearestCarrier: function () {
      var best = null, bd = Infinity, self = this;
      this.returns.forEach(function (r) {
        if (!r.clue || !self.inRetZone(r)) return;
        var d = Math.abs(r.x - RET_MID);
        if (d < bd) { bd = d; best = r; }
      });
      return best;
    },

    nearestReturn: function () {
      var best = null, bd = Infinity, self = this;
      this.returns.forEach(function (r) {
        if (!self.inRetZone(r)) return;
        var d = Math.abs(r.x - RET_MID);
        if (d < bd) { bd = d; best = r; }
      });
      return best;
    },

    /* Take a piece off line 5. It is not a difficult thing to do; it simply
       cannot be done at the same time as the other thing, and the schedule
       is written as though it could. */
    pull: function (atX) {
      if (this.open) { this.lastAction = 'reading'; return false; }
      var r = atX == null ? this.nearestReturn() : this.returnAt(atX);
      if (!r) { this.lastAction = 'noreturn'; return false; }
      this.returns = this.returns.filter(function (q) { return q !== r; });
      /* Nothing here touches the press cooldown. Taking a piece off costs
         the second it takes and the part that may go by while you are up
         there, and that is all it has ever needed to cost. */
      this.shift.pulled++;
      if (r.faulty) this.shift.pulledFaulty++; else this.shift.pulledSound++;
      this.flashes.push({
        t: 0.9, x: r.x, y: LAY.retPartY, kind: r.faulty ? 'pull' : 'pullgood'
      });
      this.lastAction = r.faulty ? 'pull' : 'pullgood';
      SOL.audio.lift();
      return true;
    },

    /* Turn a piece over and look at it properly, then put it back on the
       belt. It does not do the job: a fault you looked at is still a fault
       going past you, and you will have to reach for it again.

       Almost every piece has nothing on it. That is the whole reason this
       is not a button to hold down, and the reason a player who finds
       something has actually found it. */
    look: function (atX) {
      if (this.open) { this.lastAction = 'reading'; return false; }
      var r = atX == null ? this.nearestCarrier() : this.returnAt(atX);
      /* Only a taped piece can be investigated. There is nothing to turn
         over on an ordinary one — the tape is the whole signal, and a look
         that found nothing would just be a worse way of pulling. */
      if (!r || !r.clue) {
        this.lastAction = 'nolook';
        this.say(C.LOOK_EMPTY, 1.8, 'line5');
        return false;
      }
      this.shift.looked++;
      this.lastAction = r.clue ? 'found' : 'nothing';
      if (r.clue) {
        var clue = r.clue;
        r.clue = null;
        this.flashes.push({ t: 1.1, x: r.x, y: LAY.retPartY, kind: 'look' });
        this.read_(clue);
      } else {
        this.flashes.push({ t: 1.1, x: r.x, y: LAY.retPartY, kind: 'nothing' });
        SOL.audio.turn();
      }
      return true;
    },

    /* The yard camera. No cycle cost — it is bolted to your bench and you
       only turned your head. What it costs is the reading, and ninety-five
       scrip that could have been a foot pedal. */
    lookDock: function () {
      if (this.open) { this.lastAction = 'reading'; return false; }
      if (!this.kit || !this.kit.dock) { this.lastAction = 'nodock'; return false; }
      if (!this.dockUp) {
        this.lastAction = 'dockidle';
        this.say(C.DOCK_IDLE, 1.8, 'dock');
        return false;
      }
      var clue = this.dockUp;
      this.dockUp = null;
      this.lastAction = 'found';
      return this.read_(clue);
    },

    /* Nearest unstamped part inside the press zone to the given x. */
    candidate: function (atX) {
      var best = null, bd = Infinity;
      var x = atX == null ? ZONE_MID : atX;
      for (var i = 0; i < this.parts.length; i++) {
        var p = this.parts[i];
        if (p.stamped || !this.inZone(p)) continue;
        var d = Math.abs(p.x - x);
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    },

    strike: function () {
      this.ramPhase = 'down'; this.ramT = 0;
    },

    stamp: function (atX) {
      if (this.open) { this.lastAction = 'reading'; return false; }
      /* The ceiling on a shift. Not a cooldown bolted on to make the game
         harder — it is the reason the catalogue exists, and the reason the
         schedule eventually cannot be met by a person. */
      if (this.charge < 1) { this.lastAction = 'charging'; return false; }
      var p = this.candidate(atX);
      if (!p) { this.lastAction = 'empty'; return false; }
      p.stamped = true;
      this.shift.stamped++;
      this.charge = 0;
      this.strike();
      this.flashes.push({ t: 0.30, x: p.x, kind: 'stamp' });
      this.lastAction = 'stamp';
      SOL.audio.stamp();
      return true;
    },

    /* Walking off the line. Two presses, because it is not a thing to do by
       misclicking, and gated on having a reason you could give out loud. */
    stopLine: function (g) {
      var ok = L.canStop(this.run, this.shift);
      if (ok !== true) {
        this.lastAction = ok === 'early' ? 'stopearly' : 'stopunreasoned';
        this.say(ok === 'early' ? C.STOP_EARLY : C.STOP_UNREASONED, 3.2, 'stop');
        return false;
      }
      if (this.stopArm <= 0) {
        this.stopArm = 3.0;
        this.lastAction = 'stoparmed';
        SOL.audio.lever && SOL.audio.lever();
        return false;
      }
      this.stopArm = 0;
      this.shift.stopped = true;
      this.lastAction = 'stopped';
      SOL.audio.lineOff && SOL.audio.lineOff();
      this.endShift(g);
      return true;
    },

    scrap: function (atX) {
      if (this.open) { this.lastAction = 'reading'; return false; }
      if (this.shift.n < L.SCRAP_FROM_SHIFT) { this.lastAction = 'noscrap'; return false; }
      var p = this.candidate(atX);
      if (!p) { this.lastAction = 'empty'; return false; }
      this.parts = this.parts.filter(function (q) { return q !== p; });
      this.shift.scrapped++;
      this.flashes.push({ t: 0.45, x: p.x, kind: 'scrap' });
      this.lastAction = 'scrap';
      SOL.audio.scrap && SOL.audio.scrap();
      return true;
    },

    endShift: function (g) {
      var sh = this.shift;
      if (sh.over) return;
      /* The bin is emptied during the shift now, not after it, so the
         hooter goes straight to the sheet. There used to be a screen here
         with a man explaining that sorting the rubbish was pointless. */
      L.closeShift(g.run, sh);
      g.go('summary', { shift: sh });
    },

    /* ----- input ----- */

    key: function (e, g) {
      if (this.open) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') this.closeInquiry();
        return;
      }
      if (e.key === 'd' || e.key === 'D') { this.lookDock(); return; }
      /* X takes a piece off line 5, S scraps at the press. There is no key
         for investigating: a marked piece is clicked, which is the whole of
         how that channel is discovered. */
      if (this.bin) {
        if (e.key === 'Escape' || e.key === 'Enter') this.closeBin(g);
        return;
      }
      if (e.key === 'x' || e.key === 'X') { this.pull(null); return; }
      if (e.key === 's' || e.key === 'S') { this.scrap(null); return; }
      if (e.key === ' ') { this.stamp(null); return; }
      if (e.key === 'q' || e.key === 'Q') { this.stopLine(g); return; }
    },

    pointer: function (x, y, type, g) {
      var hit = null;
      for (var i = 0; i < this.hits.length; i++) {
        if (D.inRect(x, y, this.hits[i])) { hit = this.hits[i]; break; }
      }
      g.hoverId = hit ? hit.id : null;
      if (type !== 'down') return;

      if (this.open) {
        if (hit && hit.id === 'close') this.closeInquiry();
        return;
      }
      if (this.bin) {
        if (hit && hit.id === 'binclose') { this.closeBin(g); return; }
        if (hit && hit.id.indexOf('sort:') === 0) {
          this.sortItem(parseInt(hit.id.slice(5), 10), g);
        }
        return;
      }
      if (hit && hit.id === 'bin') { this.openBin(g); return; }
      if (hit && hit.id === 'stop') { this.stopLine(g); return; }
      if (hit && hit.id === 'dock') { this.lookDock(); return; }
      /* Line 5. A piece with red tape on it is read; anything else is
         taken off. Reading it consumes the tape, so a second click on the
         same piece does the job instead — which is how a player learns
         that the two are the same reach made two different ways. */
      if (y >= LAY.retY - 44 && y <= LAY.retY + LAY.retH + 16) {
        var got = this.returnAt(x);
        if (got && got.clue) this.look(x);
        else this.pull(x);
        return;
      }
      // the whole belt band is a stamping surface
      if (y >= LAY.beltY - 40 && y <= LAY.beltY + LAY.beltH + 20) this.stamp(x);
    },

    /* ----- render ----- */

    draw: function (ctx, t, g) {
      var sh = this.shift;
      var cfg = sh.cfg;
      this.hits = [];

      S.hall(ctx, t, {
        mood: cfg.mood, lamps: 4, floorY: LAY.floorY, still: g.frozen
      });

      // line 5 first: it is upstage, so everything else is drawn over it
      drawReturnLine(ctx, t, cfg, this.kit && this.kit.lamp, this.retPhase);
      for (var r = 0; r < this.returns.length; r++) {
        drawReturn(ctx, this.returns[r], t, this.kit || {});
      }

      drawPressFrame(ctx);

      // belt
      S.belt(ctx, 0, LAY.beltY, W, LAY.beltH, this.beltPhase);
      S.beltLight(ctx, LAY.zoneX0 - 150, LAY.beltY, (LAY.zoneX1 - LAY.zoneX0) + 300,
        LAY.beltH, 0.7 + 0.5 * cfg.mood);
      drawZone(ctx, t);

      for (var i = 0; i < this.parts.length; i++) drawPart(ctx, this.parts[i], t);

      drawRam(ctx, this.ram);

      // strike flash
      for (var f = 0; f < this.flashes.length; f++) {
        var fl = this.flashes[f];
        var span = FLASH_SPAN[fl.kind] || 0.45;
        var a = D.clamp(fl.t / span, 0, 1);
        var fy = fl.y || LAY.partY;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        var col = fl.kind === 'stamp' ? '226,238,246' : '150,162,172';
        var gr = ctx.createRadialGradient(fl.x, fy, 2, fl.x, fy, 90);
        gr.addColorStop(0, 'rgba(' + col + ',' + (0.34 * a) + ')');
        gr.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(fl.x, fy, 90, 0, 6.3); ctx.fill();
        ctx.restore();
        if (fl.kind === 'scrap') {
          D.stencil(ctx, 'SCRAPPED', fl.x, LAY.partY - 52,
            { size: 10, track: 3, align: 'center', color: P.mid, alpha: a });
        }
        if (fl.kind === 'look') retSay(ctx, C.LOOK_FOUND, a, P.bright);
        if (fl.kind === 'nothing') retSay(ctx, C.LOOK_NOTHING, a, 'rgba(112,124,134,0.95)');
        /* Line 5's outcomes, said in one fixed place under the bay rather
           than over the piece they happened to. Following the piece put
           them first across the conveyor's own signage and then across the
           vent grille of a machine, where neither could be read. */
        if (fl.kind === 'pull' || fl.kind === 'pullgood') {
          retSay(ctx, fl.kind === 'pull' ? C.PULLED_OK : C.PULLED_GOOD, a,
            fl.kind === 'pull' ? P.mid : 'rgba(120,132,142,0.95)');
        }
        if (fl.kind === 'reject') retSay(ctx, C.SENT_BACK, a * 0.9, P.mid);
      }

      drawApron(ctx, sh);
      drawBin(ctx, this.binDone, g.hoverId === 'bin');
      if (!this.open && !this.bin) {
        this.hits.push({ x: BIN.x, y: BIN.y, w: BIN.w, h: BIN.h + 18, id: 'bin' });
      }
      this.drawStation(ctx, t, g);
      this.drawHud(ctx, t, g);
      if (this.kit && this.kit.dock) {
        drawDock(ctx, t, !!this.dockUp, g.hoverId === 'dock');
        this.hits.push({ x: DOCK.x, y: DOCK.y, w: DOCK.w, h: DOCK.h, id: 'dock' });
      }
      if (this.open) this.drawInquiry(ctx, t, g);
      else if (this.bin) this.drawSort(ctx, t, g);
      else this.drawRadio(ctx, t);
      Screens._footerRail(ctx, this.footerHint());
      D.crt(ctx, W, H, t);
    },

    /* The sorting window. Two labelled bins and the things in the basket
       between them; click a thing and it goes. Which bin you send it to is
       not asked, because both of them are the same skip and the game is not
       going to pretend otherwise by scoring it.

       One of the six has red tape on it. That is the only thing on this
       screen that is not grey, and it is the whole reason the chore is in
       the game. */
    drawSort: function (ctx, t, g) {
      var b = this.bin;
      var nx = SORT.x, nw = SORT.w, px = nx + 44, pw = nw - 88;
      var rows = Math.ceil(b.items.length / 3);
      var nh = SORT.top + rows * SORT.row + 26 + 46 + 26;
      var ny = Math.round((H - nh) / 2) + 8;
      this.card = { x: nx, y: ny, w: nw, h: nh };

      ctx.fillStyle = 'rgba(11,14,16,0.72)';
      ctx.fillRect(0, 0, W, H);
      Screens._notice(ctx, nx, ny, nw, nh, C.BIN_HEADING);

      /* The title and the reminder used to share a line, which fitted the
         wide card this started as and ran straight through it once the card
         was narrowed. The reminder sits under the title now, where it can
         be as long as it needs to be. */
      var y = ny + 58;
      D.txt(ctx, C.BIN_TITLE, px, y,
        { size: 20, weight: 600, family: 'sans', color: P.bright, track: 3.4 });
      y += 20;
      D.stencil(ctx, C.BIN_SUB, px, y,
        { size: 9.5, track: 2.2, color: P.faint });
      y += 12;
      D.seam(ctx, px, y, pw);

      var cw = Math.floor(pw / 3);
      b.items.forEach(function (it, i) {
        if (it.gone) return;
        var cx = px + (i % 3) * cw + cw / 2;
        var cy = ny + SORT.top + Math.floor(i / 3) * SORT.row + 44;
        var hot = g.hoverId === 'sort:' + i;

        // the thing itself: a ball of paper, or a curl of swarf
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((D.rnd(i * 3.7) - 0.5) * 0.5);
        if (it.kind === 'paper') {
          ctx.fillStyle = hot ? 'rgba(196,190,178,0.62)' : 'rgba(168,163,152,0.48)';
          ctx.beginPath();
          for (var k = 0; k < 9; k++) {
            var a = (k / 9) * 6.28;
            var rr = 24 + D.rnd(i * 5.1 + k) * 9;
            ctx[k ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
          }
          ctx.closePath(); ctx.fill();
          // the creases
          ctx.strokeStyle = 'rgba(90,86,78,0.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-14, -6); ctx.lineTo(4, 3); ctx.lineTo(-6, 14);
          ctx.moveTo(10, -12); ctx.lineTo(2, 2);
          ctx.stroke();
        } else {
          ctx.strokeStyle = hot ? 'rgba(176,186,194,0.7)' : 'rgba(140,150,158,0.5)';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          for (var q = 0; q < 30; q++) {
            var aa = q * 0.42, rr2 = 4 + q * 0.8;
            ctx[q ? 'lineTo' : 'moveTo'](Math.cos(aa) * rr2, Math.sin(aa) * rr2 * 0.7);
          }
          ctx.stroke();
        }

        /* The mark. A strip of red tape on one of the balls of paper, and
           the only colour on the screen. */
        if (it.marked) {
          ctx.save();
          ctx.rotate(0.38);
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = P.markLo;
          ctx.fillRect(-5, -25, 10, 50);
          ctx.fillStyle = P.mark;
          ctx.fillRect(-5, -25, 7, 50);
          ctx.restore();
        }
        ctx.restore();

        D.stencil(ctx, it.label, cx, cy + 44,
          { size: 8.5, track: 1.8, align: 'center',
            color: hot ? P.text : 'rgba(112,120,127,0.95)' });

        this.hits.push({ x: cx - 42, y: cy - 42, w: 84, h: 92, id: 'sort:' + i });
      }, this);

      var b2 = { x: px - 14, y: ny + nh - 46 - 26, w: 250, h: 46, id: 'binclose' };
      Screens._control(ctx, b2, b.left > 0 ? C.BIN_LEAVE : C.BIN_DONE_BTN,
        g.hoverId === 'binclose' ? 'hover' : 'idle', { size: 12 });
      this.hits.push(b2);
      D.stencil(ctx, C.BIN_NOTE, px + pw, ny + nh - 46,
        { size: 9, track: 1.6, color: 'rgba(112,120,127,0.95)', align: 'right' });
    },

    /* The bench set. One line, low on the screen, in the plant's own grey
       and at the plant's own size — the same strip whether it is reading
       out the weather or the thing you bought it for. Nothing marks the
       difference, which is the entire point of the sixty scrip. */
    drawRadio: function (ctx, t) {
      var text = this.radioText();
      if (!text) return;
      /* In the band between the bottom of the station fittings and the
         footer rail, which is the only clear strip on the screen. Set
         higher up it printed across STATION 4-C and the master stop. */
      var y = H - 37;
      ctx.fillStyle = 'rgba(4,6,7,0.62)';
      ctx.fillRect(0, y - 15, W, 22);
      D.stencil(ctx, C.RADIO_LABEL, 22, y,
        { size: 8, track: 2, color: 'rgba(120,128,135,0.95)' });
      D.txt(ctx, text, 108, y,
        { size: 11.5, color: 'rgba(168,178,186,0.95)' });
    },

    /* The two station controls, and the one line the station ever says. */
    drawStation: function (ctx, t, g) {
      var stopState = L.canStop(this.run, this.shift);

      // the master stop is bolted to the station from the first shift; it
      // simply does not answer to you until it does
      var armed = this.stopArm > 0;
      drawSwitch(ctx, SW.stop, C.STOP_LABEL,
        armed ? C.STOP_ARMED : C.STOP_READY,
        { thrown: armed, hover: g.hoverId === 'stop',
          arm: this.stopArm / 3.0, dead: stopState !== true });
      this.hits.push(SW.stop);

      /* On the apron, under the hatching and beside the control it refers
         to. It used to be centred over the belt, where it printed straight
         across the moving parts and could not be read at all. */
      if (this.notice) {
        var a = D.clamp(this.notice.t / 0.9, 0, 1);
        var anchor = SW[this.notice.at] || ANCH[this.notice.at] || SW.stop;
        D.stencil(ctx, this.notice.text, anchor.x, anchor.y - 12,
          { size: 10, track: 2.4, color: P.mid, alpha: a });
      }
    },

    footerHint: function () {
      if (this.open) {
        return this.open.read ? 'ENTER OR ESC TO GO BACK' : C.INQUIRY_RUNNING;
      }
      if (this.bin) return C.BIN_FOOTER;
      /* By the last shifts there are five controls. Spelled out in
         sentences that is a wall of text across the bottom of a factory;
         an operator's card would be terse, so this is. */
      var keys = ['SPACE STAMP', C.PULL_HINT];
      if (!this.binDone) keys.push(C.BIN_HINT);
      if (this.shift && this.shift.n >= L.SCRAP_FROM_SHIFT) keys.push('S SCRAP');
      /* The camera is listed only once it is on the bench, and then always
         — not when there happens to be something in it. A prompt that came
         and went would be the amber crate again, in words. */
      if (this.kit && this.kit.dock) keys.push(C.DOCK_HINT);
      if (L.canStop(this.run, this.shift) === true) keys.push(C.STOP_HINT);
      return keys.join('  ·  ');
    },

    /* The item, read over the top of a line that keeps running. The belt
       and everything below it is deliberately left uncovered. */
    drawInquiry: function (ctx, t, g) {
      var o = this.open, clue = o.clue;

      // recede the hall and the press; leave the work visible
      ctx.fillStyle = 'rgba(11,14,16,0.70)';
      ctx.fillRect(0, LAY.hudY + LAY.hudH, W, LAY.beltY - 8 - (LAY.hudY + LAY.hudH));

      var nx = 170, nw = W - 340, pw = nw - 88;
      var lineOpt = { size: 13.5, color: P.text, lineHeight: 22 };
      var rows = clue.lines.map(function (s) { return D.wrap(ctx, s, pw, lineOpt).length; });
      var bodyH = rows.reduce(function (a, n) { return a + n * 22 + 12; }, 0);
      // the footnote's room is always reserved, so the card cannot change
      // size underneath the player as lines surface
      var nh = 78 + 26 + 24 + bodyH + 18 + 40 + 26 + 22;
      var ny = Math.max(LAY.hudY + LAY.hudH + 10, LAY.beltY - 22 - nh);

      Screens._notice(ctx, nx, ny, nw, nh, C.INQUIRY_HEADING);
      // the one rule in the build allowed to be lit
      ctx.fillStyle = P.accent;
      ctx.fillRect(nx, ny + 28, 3, nh - 28);

      var px = nx + 44;
      var y = ny + 78;

      D.txt(ctx, clue.kind, px, y,
        { size: 19, weight: 600, family: 'sans', color: P.accentHi, track: 3.6 });
      D.stencil(ctx, 'SHIFT ' + this.shift.n, px + pw, y - 2,
        { size: 9.5, track: 2.6, color: P.faint, align: 'right' });
      y += 20;
      D.stencil(ctx, clue.source, px, y, { size: 10, track: 1.6, color: P.dim });
      y += 24;
      D.seam(ctx, px, y - 8, pw);

      for (var i = 0; i < clue.lines.length; i++) {
        if (i >= o.shown) break;
        // the line that just arrived comes up out of the dark
        var age = o.t - (L.CLUE_LEAD + i * L.CLUE_LINE);
        var a = D.clamp(age / 0.55, 0, 1);
        y = D.para(ctx, clue.lines[i], px, y + 10, pw, {
          size: lineOpt.size, lineHeight: lineOpt.lineHeight,
          color: P.text, alpha: 0.15 + 0.85 * a
        }) + 2;
      }

      // what it is costing, in the plant's own units, updated live
      var by = ny + nh - 82;
      D.seam(ctx, px, by - 12, pw);
      /* What it is costing, live, in the only unit that still moves while
         you read: the clock. Parts passing was the old figure and it now
         reads zero almost always, because the line is barely turning. */
      D.stencil(ctx, C.INQUIRY_COST, px + pw, by + 14,
        { size: 9.5, track: 2.4, color: P.faint, align: 'right' });
      D.txt(ctx, Math.floor(this.shift.readSecs) + 's', px + pw, by + 38,
        { size: 20, weight: 600, color: P.mid, align: 'right' });

      var b = { x: px - 14, y: by, w: 268, h: 42, id: 'close' };
      Screens._control(ctx, b, o.read ? C.INQUIRY_CLOSE_DONE : C.INQUIRY_CLOSE_EARLY,
        g.hoverId === 'close' ? 'hover' : (o.read ? 'active' : 'idle'),
        { size: 12, accent: o.read });
      this.hits.push(b);
      if (!o.read) {
        // under the button, clear of the cost readout on the right
        D.stencil(ctx, C.INQUIRY_UNREAD, px - 14, by + 58,
          { size: 8.5, track: 1.8, color: 'rgba(116,124,131,0.95)' });
      }
    },

    drawHud: function (ctx, t, g) {
      var sh = this.shift, cfg = sh.cfg;
      Screens._headerRail(ctx, C.PLANT_NAME,
        'SHIFT ' + sh.n + ' OF ' + L.SHIFT_COUNT + ' · ' + C.shift(sh.n).title);

      // console bar
      var y = LAY.hudY, h = LAY.hudH;
      D.plate(ctx, 0, y, W, h, { top: '#282b2e', bot: '#1b1d1e', r: 0 });
      D.seam(ctx, 0, y + h, W, { alpha: 0.9 });

      var pad = 26;
      // quota
      var behind = sh.stamped < Math.round(cfg.target * (1 - sh.timeLeft / cfg.duration));
      Screens._gauge(ctx, pad, y + 9, 210, h - 18, 'STAMPED THIS SHIFT',
        String(sh.stamped).padStart(2, '0') + '  /  ' + cfg.target,
        { size: 24, color: behind ? P.mid : P.bright });

      // clock
      var cw = 300, cx = (W - cw) / 2;
      var frac = sh.timeLeft / cfg.duration;
      Screens._gauge(ctx, cx, y + 9, cw, h - 18, 'SHIFT REMAINING', null);
      var mm = Math.floor(sh.timeLeft / 60), ss = Math.floor(sh.timeLeft % 60);
      D.txt(ctx, mm + ':' + String(ss).padStart(2, '0'), cx + cw - 14, y + h - 15,
        { size: 22, weight: 600, color: P.text, align: 'right' });
      D.meter(ctx, cx + 14, y + h - 28, cw - 96, 12, frac,
        { hi: P.mid, lo: P.dim });

      // losses
      Screens._gauge(ctx, W - pad - 210, y + 9, 210, h - 18, 'PASSED UNFINISHED',
        String(sh.missed), { size: 24, right: true, color: P.dim });

      /* The cycle, under the count it limits. Deliberately an instrument on
         the plant's own console and drawn like one — this is the plant
         telling you how fast you are permitted to be, not a power bar. */
      D.stencil(ctx, C.CHARGE_LABEL, pad, y + h + 18,
        { size: 9, track: 2.2, color: P.faint });
      /* A lighter channel than the other meters get: an empty cycle has to
         read as an instrument sitting at zero, not as an instrument that
         is not there, and after a reach it sits at zero for a while. */
      D.meter(ctx, pad + 46, y + h + 10, 164, 8, this.charge,
        { hi: this.charge >= 1 ? P.mid : P.faint, lo: P.dim, trough: '#272a2d' });
      /* What line 5 has cost so far. It sits on the plant's console because
         the plant is the one keeping this number. */
      D.stencil(ctx, C.SENT_BACK + '  ' + sh.rejects, 280, y + h + 18,
        { size: 9.5, track: 2.2, color: sh.rejects > 0 ? P.mid : P.faint });

      if (sh.n >= L.SCRAP_FROM_SHIFT) {
        D.stencil(ctx, 'SCRAPPED ' + sh.scrapped, W - pad - 210, y + h + 18,
          { size: 9.5, track: 2.2, color: P.faint });
      }

      /* There was a lamp here: an amber pip on the console that came on
         whenever there was something to find, with ITEM ON THE LINE beside
         it. It is gone. The console reports production and nothing else,
         which is all a console in this building would ever have reported. */
    }
  };

  SOL.LAY = LAY;

})(typeof window !== 'undefined' ? window : globalThis);
