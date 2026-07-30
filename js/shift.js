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

    /* Tucked in behind the piece, so it shows past the edge of it — drawn
       first, and deliberately not centred, because a slip somebody has
       pushed in behind a part does not sit square. */
    if (r.clue && !r.bare) drawSlip(ctx, r.x + 10, y - 6, 15, 11, 0.22, false);

    if (r.bare) {
      // no part at all: the slip is the whole of what is on the belt, and
      // the circular's own is half again as big and lit
      if (r.reveal) drawSlip(ctx, r.x, y, 32, 24, -0.10, false, true);
      else drawSlip(ctx, r.x, y, 20, 15, -0.12, false);
      return;
    }

    S.widget(ctx, r.x, y, 1.05, r.form, faulty
      ? { hi: '#81868a', mid: '#494e52', lo: '#181a1c', rot: 0.32 }
      : { hi: '#8e9397', mid: '#52575b', lo: '#1a1c1e' });

    if (faulty) {
      /* The split, raked by whatever light there is, and identical on
         every fault. It carried the information tell for one revision —
         warm on the pieces with something on them — and the measurement
         said that was a two-per-cent chroma difference on a 1.4-pixel
         line, which is not a tell. The paper does that job now, and the
         split has gone back to meaning one thing only: this will not
         pass. */
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

    /* Nothing else is drawn on it. There was a strip of red tape here, and
       then a glint, and both were things the game had added to the part to
       point at it. The mark is in the split now and nowhere else. */
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

  /* How long an aeroplane takes to cross the window band. Long enough to
     notice out of the corner of the eye and short enough that noticing is
     not the same as having time to spare. */
  var PLANE_WINDOW = 22;

  /* Where a slip left on the plant sits: on the casing of the machine row
     behind line 5, clear of the press and of both belts. */
  var BGSLIP = { x: 168, y: LAY.floorY - 44, w: 25, h: 18 };

  /* The aeroplane crosses the clerestory itself — the glazed band high on
     the far wall — not the strip of console underneath it. Drawn inside
     the band and then glazed back over, so it is unmistakably outside the
     building, which is the only time this game ever shows you that there
     is an outside. */
  var PLANE = { y: 122 + 74 / 2, w: 38, h: 11 };

  /* A slip of cream paper. The only warm thing on any working screen, and
     the only signal the game gives that something can be read: no icon, no
     prompt, no colour but the colour of paper in a grey building.

     It replaces, in order, an amber crate, a strip of red tape, a red
     glint and a warm tint inside a fault's split. Every one of those was
     either a label the game had stuck on the world or too faint to find.
     Paper is neither: it is an object that belongs in a factory, it is
     legible at a glance because nothing else in the hall is that colour,
     and it does not claim the piece it is behind is special. */
  function drawSlip(ctx, x, y, w, h, rot, hot, lit) {
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    /* The circular's pair carries a little of the hall's light off its
       edge, which is the only halo anywhere in the build. */
    if (lit) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var hg = ctx.createRadialGradient(0, 0, w * 0.4, 0, 0, w * 1.5);
      hg.addColorStop(0, 'rgba(226,216,184,0.22)');
      hg.addColorStop(1, 'rgba(226,216,184,0)');
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(0, 0, w * 1.5, 0, 6.3); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(-w / 2 + 1.5, -h / 2 + 2, w, h);
    ctx.fillStyle = lit ? P.paperLit : (hot ? P.paperHi : P.paper);
    ctx.fillRect(-w / 2, -h / 2, w, h);
    // a fold and two lines of something written on it, at this size just texture
    ctx.fillStyle = 'rgba(58,52,42,0.5)';
    var rows = h >= 15 ? 3 : 2, step = Math.max(3, (h - 6) / rows);
    for (var i = 0; i < rows; i++) {
      ctx.fillRect(-w / 2 + 2.5, -h / 2 + 3 + i * step,
        w - 5 - (i === rows - 1 ? 4 : 0), 0.9);
    }
    ctx.strokeStyle = 'rgba(58,52,42,0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
    ctx.restore();
  }

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
  /* Twenty things rather than six, on five columns. It is a chore, and a
     chore with six items in it was over before the player had registered
     that it was one. */
  /* The basket, tipped out on the bench. Twenty things scattered across
     the middle of the card, a chute down each side, and you drag them: the
     paper right, everything else left. There is no label on any of them —
     you have to look at the thing itself, which is the only reason the
     chore is a chore and the only reason a clue is worth finding in it. */
  var SORT = { x: 132, w: W - 264, top: 78, bodyH: 372 };

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
  /* Where the black one ended up this frame, so the hit region and the
     drawing cannot drift apart. */
  var BLACK = { x: 0, y: 0, w: 71, h: 26 };

  function drawDock(ctx, t, has, hover, read, closer) {
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
      /* The night's freight, from above the dock. Three of the company's
         own lorries, pale in the gate lamp and marked as company lorries
         are, and one that is not: unmarked, unlit, black from end to end.

         The whole item is this picture. It used to open a card over the
         hall and stop the shift to read three sentences at you, which made
         ninety-five scrip buy an interruption. CLUES.md is explicit that
         the camera is a visual and not an interruption, and it is right:
         the thing the camera is for is that you have to be looking at it. */
      var lorry = function (bx, by, dark, boxes) {
        var body = dark ? 'rgba(2,3,4,0.98)' : 'rgba(150,162,172,0.82)';
        var trim = dark ? 'rgba(24,28,31,0.9)' : 'rgba(196,210,220,0.9)';
        ctx.fillStyle = body;
        ctx.fillRect(bx, by + 5, 44, 15);        // bed
        ctx.fillRect(bx + 44, by + 9, 15, 11);   // cab
        ctx.fillStyle = trim;
        if (!dark) {
          // company markings, at this size two strokes and a panel line
          ctx.fillRect(bx + 5, by + 10, 16, 2);
          ctx.fillRect(bx + 5, by + 14, 10, 1.5);
        }
        ctx.fillStyle = dark ? 'rgba(1,2,3,1)' : 'rgba(120,132,142,0.9)';
        ctx.beginPath();
        ctx.arc(bx + 11, by + 20, 3.2, 0, 6.3);
        ctx.arc(bx + 36, by + 20, 3.2, 0, 6.3);
        ctx.arc(bx + 53, by + 20, 3.2, 0, 6.3);
        ctx.fill();
        /* What is going into the black one, once somebody has gone over to
           the monitor to look. Crates, and a cross chalked on each. */
        if (boxes) {
          /* Stacked on the apron behind the tailgate, clear of the lorry
             parked alongside — they were tucked in on the near side first
             and the white one in front of them covered every one. */
          for (var q = 0; q < 3; q++) {
            var qx = bx + 3 + q * 11, qy = by - 11 + (q % 2) * 2;
            ctx.fillStyle = 'rgba(18,21,23,0.98)';
            ctx.fillRect(qx, qy, 9, 8);
            ctx.strokeStyle = 'rgba(150,164,175,0.55)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(qx + 1.5, qy + 1.5); ctx.lineTo(qx + 7.5, qy + 6.5);
            ctx.moveTo(qx + 7.5, qy + 1.5); ctx.lineTo(qx + 1.5, qy + 6.5);
            ctx.stroke();
          }
        }
      };

      /* All four on the apron, in front of the wall and inside the pool
         the gate lamp throws, in two ranks of two. They were laid out
         across the horizon line to begin with, which put half of them in
         the sky and the rest behind the wall. */
      // both ranks inside the tube: the front one overflowed the bottom
      // of the picture by the depth of its wheels
      var backY = horizon + 4, frontY = horizon + 30;
      lorry(DOCK.x + 12, backY, false);
      lorry(DOCK.x + 96, backY, false);
      lorry(DOCK.x + 12, frontY, false);
      // and the one that is not one of theirs, nearest the camera
      lorry(DOCK.x + 96, frontY, true, closer);
      BLACK.x = DOCK.x + 96; BLACK.y = frontY;

      // two men at the straps of the black one, working
      var sway = Math.sin(t * 1.6) * 2;
      [[DOCK.x + 86, sway], [DOCK.x + 78, -sway]].forEach(function (m) {
        ctx.fillStyle = 'rgba(1,2,3,1)';
        ctx.fillRect(m[0], frontY + 6 + m[1], 4, 14);
        ctx.beginPath(); ctx.arc(m[0] + 2, frontY + 4 + m[1], 2.4, 0, 6.3); ctx.fill();
      });

      // a rim of the gate lamp down its near side, so it is a shape in the
      // dark rather than a hole in the picture
      ctx.fillStyle = 'rgba(150,166,178,0.34)';
      ctx.fillRect(DOCK.x + 96, frontY + 4, 63, 1.2);
      ctx.fillRect(DOCK.x + 96, frontY + 5, 1.4, 15);

      /* A hairline round it once it has been noticed, so a player who has
         read the picture can find the thing they are being asked to click
         on. Before that there is nothing but the picture. */
      if (read && !closer) {
        ctx.strokeStyle = hover === 'lorry'
          ? 'rgba(226,238,246,0.6)' : 'rgba(196,212,224,0.26)';
        ctx.lineWidth = 1;
        ctx.strokeRect(DOCK.x + 92.5, frontY + 0.5, 71, 26);
      }
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
    /* One string on this line, not two. The alert used to go out as a
       transient notice at the same anchor as well, and the two printed
       through each other for the six seconds they overlapped. */
    D.stencil(ctx, (has && !read) ? C.DOCK_ALERT : C.DOCK_LABEL,
      DOCK.x, DOCK.y + DOCK.h + 15,
      { size: 8, track: 1.8, color: has ? P.text : P.faint });
    /* The key hint used to sit on this line too, right-aligned, and on a
       196-pixel plate the two met in the middle. It is on the key card at
       the foot of the screen and that is enough. */
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
    carry: null,     // a part-channel clue waiting for a piece to ride in on
    carryQ: [],      // the rest of them, in schedule order
    slipQ: [],       // slips that ride line 5 with no part under them
    bgQ: [],         // slips left on a machine casing down the hall
    bgUp: null,      // the one currently lying there, if any
    revealBg: false, // the circular's own slip, on the machine casing
    revealSlip: null,// and its twin, riding line 5
    planeQ: [],      // banners behind an aeroplane
    planeUp: null,   // the one currently crossing the window band
    dockQ: [],       // yard-camera items, in schedule order
    dockUp: null,    // the one currently in frame, if any
    dockRead: false, // the picture has been looked at properly
    dockCloser: false, // and somebody went over to the black one
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
      /* The man from the works office interrupts the fourth shift rather
         than waiting for the end of it, so there has to be a way back to a
         shift already in progress. Everything below this line rebuilds the
         shift from nothing, which is exactly wrong for that case. */
      if (opts && opts.resume && this.shift && !this.shift.over) {
        SOL.audio.lineOn && SOL.audio.lineOn();
        return;
      }
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
      this.carryQ = due(L.cluesVia(n, 'part', led));
      this.slipQ = due(L.cluesVia(n, 'slip', led));
      this.bgQ = due(L.cluesVia(n, 'bgslip', led));
      this.planeQ = due(L.cluesVia(n, 'plane', led));
      this.dockQ = due(L.cluesVia(n, 'dock', led));
      this.radioQ = due(L.cluesVia(n, 'radio', led));
      this.carry = null;
      this.dockUp = null;
      this.dockRead = false;
      this.dockCloser = false;
      this.bgUp = null;
      this.revealBg = false;
      this.revealSlip = null;
      this.planeUp = null;
      this.ambient = null;
      this.filler = n * 3;
      this.fillerT = 4.0;
      /* The bin at the end of the shift is not scheduled here — it is
         whatever is left over when the hooter goes, and the trash screen
         asks logic for it then. */
      this.shift.marksSeen =
        this.carryQ.length + this.slipQ.length + this.bgQ.length +
        this.planeQ.length + this.dockQ.length + this.radioQ.length
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

      /* Reading throttles the line down to a crawl, eased in and out
         rather than snapped so it reads as deliberate rather than as a
         stall. It is not a fiction — no factory slows for a man reading a
         docket — it is the game giving you room.

         The clock goes down with it. For a long time it did not: the shift
         burned at full speed while the line barely moved, and that was
         where the cost of looking lived — a minute spent reading was a
         minute of parts you never got the chance to stamp. It is on the
         same rate as the belt now, so reading costs no output at all.

         What that gives up is worth stating plainly: the free channels are
         free in every sense now. What they still cost is attention, and
         the things that expire while your eyes are on a card — a lorry
         leaves the dock, an aeroplane crosses, a piece reaches the end of
         line 5 — because none of those wait for the rate either. */
      var want = reading ? L.READ_SLOWDOWN : 1;
      this.lineRate += (want - this.lineRate) * Math.min(1, dt / 0.22);
      var rate = this.lineRate;
      var ldt = dt * rate;

      sh.timeLeft -= ldt;
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

      /* Something to find on line 5, tucked in behind the next piece to
         come along. A fault is likelier to be the one carrying it — a
         piece somebody has already had reason to handle — but it is not
         required, so a sound piece can have a slip behind it and a fault
         can have nothing. */
      if (!this.carry && this.carryQ.length && this.carryQ[0].at <= elapsed) {
        this.carry = this.carryQ.shift().clue;
      }
      /* A slip riding line 5 on its own, with no part under it at all. It
         is released on the same belt and travels at the same speed, and
         if it reaches the end of the line it goes out with everything
         else. */
      if (this.slipQ.length && this.slipQ[0].at <= elapsed) {
        this.releaseSlip(this.slipQ.shift().clue);
      }
      /* A slip left on a machine casing down the hall. It stays where it
         was put — nobody is coming to collect it — so this one is the only
         item in the game that waits for the player rather than the other
         way round. */
      if (!this.bgUp && this.bgQ.length && this.bgQ[0].at <= elapsed) {
        this.bgUp = this.bgQ.shift().clue;
      }
      /* An aeroplane across the window band with an advertising banner
         behind it. It crosses once and does not come back. */
      if (!this.planeUp && this.planeQ.length && this.planeQ[0].at <= elapsed) {
        this.planeUp = this.planeQ.shift().clue;
        this.planeT = 0;
      }
      if (this.planeUp) {
        this.planeT += dt;
        if (this.planeT > PLANE_WINDOW) {
          if (!this.open || this.open.clue !== this.planeUp) sh.marksPassed++;
          this.planeUp = null;
        }
      }

      /* The circular, once the count is there. A slip on the machine
         casing and a slip on the belt, both of them larger and lighter
         than an ordinary one, and neither of them going anywhere: if the
         one on the belt reaches the end of the line another is released
         behind it. Nothing about this can be missed by bad luck, only by
         not looking up, which is the one thing the whole piece is about. */
      if (!this.run.revealed && L.revealDue(this.run, sh)) {
        this.revealBg = true;
        var onBelt = this.returns.some(function (r) { return r.reveal; });
        if (!onBelt) {
          this.releaseSlip(L.REVEAL);
          this.returns[this.returns.length - 1].reveal = true;
        }
      }

      /* A thing dropped in the wrong chute, shaking itself off and going
         back to where it was lying. */
      if (this.bin) {
        this.bin.items.forEach(function (it) {
          if (it.wrong > 0) it.wrong = Math.max(0, it.wrong - dt);
        });
      }

      /* The man from the works office, four fifths of the way through the
         fourth shift. He interrupts the shift rather than waiting for the
         end of it. */
      if (L.officerDue(this.run, sh) && !this.open && !this.bin) {
        g.go('officer');
        return;
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
             second chance and no notice that there was a first one — except
             for the circular, which is released again behind this one and
             is not counted as gone by. */
          if (r.clue && !r.reveal) { sh.marksPassed++; r.clue = null; }
        }
        if (r.x > LAY.retExitX) rkeep.push(r);
      }
      this.returns = rkeep;

      /* The yard camera. The picture changes and nothing else happens; a
         player working the press flat out will not see that it has. */
      if (!this.dockUp && this.dockQ.length && this.dockQ[0].at <= elapsed) {
        this.dockUp = this.dockQ.shift().clue;
        this.dockT = 0;
        /* The alert is the monitor's own label changing, and nothing else.
           A transient notice at the same anchor collided with it. */
      }
      if (this.dockUp) {
        this.dockT += dt;
        // the lorry is loaded and gone, whether or not anybody looked
        if (this.dockT > L.DOCK_WINDOW) {
          if (!this.dockRead) sh.marksPassed++;
          this.dockUp = null;
          this.dockRead = false;
          this.dockCloser = false;
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
      /* An item rides in on a fault, because the only mark it has is in
         the fault's own split — a warmth in the light coming off it, where
         every other split on the line is cold. There is nothing else to
         see, so there has to be a split to see it in.

         This went back and forth. Tape and fault were separate for a while,
         which let a sound piece carry something; the tape was its own
         signal and did not need the split. The tape is gone, so they are
         one thing again, and shift 1's flaw rate went up to give it two
         faults instead of one to hang its two tips on.

         The arm never takes a piece with something on it. A machine that
         sorts by the obvious would have put it straight in the skip. */
      /* A slip goes in behind whatever comes along, with a fault three
         times likelier to be the one carrying it — somebody who has
         already had a piece in their hands is likelier to have left
         something behind it — but never required. So a sound piece can
         have a slip and a fault can have nothing, and neither of the two
         things you are watching for predicts the other. */
      var clue = null;
      if (this.carry && D.rnd(i * 6.7 + this.shift.n * 3) < (faulty ? 0.75 : 0.25)) {
        clue = this.carry;
        this.carry = null;
      }
      /* The arm's share is dealt out of the faults it can actually see,
         which is why this counts after the item is assigned rather than
         before. Counting first made every item-bearing fault a sweep the
         arm silently lost, and quietly took the arm below the price it is
         sold at. */
      var armable = false;
      if (faulty) {
        this.shift.faulty++;
        if (!clue) {
          armable = L.armTakes(this.faultIdx, E.ARM_SHARE);
          this.faultIdx++;
        }
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

    /* Some cards have a second look in them. The yard camera is the only
       one: the lorry is worth two for watching it come in and a third for
       going over to the monitor and clicking on it. */
    lookCloser: function (g) {
      if (!L.lookCloser(g.run, this.open)) return false;
      SOL.audio.reveal && SOL.audio.reveal();
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

    /* Twenty things, tipped out on the bench in a scatter. Which one has
       the mark on it is settled here rather than on the grab, so it cannot
       depend on where the player happened to reach first. Positions are
       fixed per shift too — a basket that reshuffled itself under the hand
       would be a different game and a worse one. */
    openBin: function (g) {
      if (this.bin || this.binDone || this.open) return false;
      /* Everything the basket has for this shift, not just the first thing
         in it. A shift can put two papers in there — a tip and something
         else — and handing over only one meant the second was unreachable
         for the whole run. */
      var found = L.trashFor(g.run, this.shift);
      var n = C.BIN_ITEMS.length;
      var items = [];
      var seed = this.shift.n * 17;
      for (var i = 0; i < n; i++) {
        /* Scattered across the middle third, clear of both chutes, in a
           spread that is deterministic per shift so the same basket looks
           the same to a player who leaves it and comes back. */
        items.push({
          i: i,
          kind: C.BIN_ITEMS[i].kind,
          x: 0.26 + D.rnd(seed + i * 3.1) * 0.48,
          y: 0.10 + D.rnd(seed + i * 5.7 + 91) * 0.78,
          rot: (D.rnd(seed + i * 2.3) - 0.5) * 1.1,
          marked: false,
          clue: null,
          gone: false,
          wrong: 0        // seconds left on a bounce-back
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
      this.bin = { items: items, found: found.slice(), left: n, drag: null };
      SOL.audio.paper && SOL.audio.paper();
      return true;
    },

    /* Picking a thing up. If it has something written on it, that is when
       you notice — the item opens in your hand, before you have decided
       which chute it was going in. */
    grabItem: function (idx, x, y, g) {
      var b = this.bin;
      if (!b || b.drag) return false;
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
      b.drag = { idx: idx, x: x, y: y };
      it.wrong = 0;
      SOL.audio.turn && SOL.audio.turn();
      return true;
    },

    dragItem: function (x, y) {
      if (!this.bin || !this.bin.drag) return false;
      this.bin.drag.x = x;
      this.bin.drag.y = y;
      return true;
    },

    /* Letting go. Paper belongs in the chute on the right and everything
       else in the one on the left, and a thing dropped in the wrong one
       comes straight back at you — which is the only way the sides can
       mean anything, given the note at the foot of the card says both
       chutes go in the same skip. That contradiction is the joke and it is
       load-bearing: the office does not care, and you still have to. */
    dropItem: function (g) {
      var b = this.bin;
      if (!b || !b.drag) return false;
      var it = b.items[b.drag.idx];
      var mid = SORT.x + SORT.w / 2;
      var side = b.drag.x < mid ? 'swarf' : 'paper';
      b.drag = null;
      if (!it || it.gone) return false;
      if (side !== it.kind) {
        it.wrong = 1.1;
        SOL.audio.deny && SOL.audio.deny();
        return false;
      }
      it.gone = true;
      b.left--;
      SOL.audio.lift && SOL.audio.lift();
      if (b.left <= 0) this.closeBin(g);
      return true;
    },

    /* The old click-to-sort, kept as the programmatic path. Nothing in the
       game calls it any more; the harnesses do, because driving a drag from
       the outside proves nothing about the drag. */
    sortItem: function (idx, g) {
      var b = this.bin;
      if (!b) return false;
      var it = b.items[idx];
      if (!it || it.gone) return false;
      if (!this.grabItem(idx, 0, 0, g)) return false;
      if (!b.drag) return true;          // it was a clue and it opened
      var mid = SORT.x + SORT.w / 2;
      b.drag.x = it.kind === 'paper' ? mid + 10 : mid - 10;
      return this.dropItem(g);
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
        if (r.bare || !self.inRetZone(r)) return;
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
      // a slip is not stock and there is nothing to take off
      if (r && r.bare) r = null;
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
      if (r && r.reveal) return this.takeReveal();
      /* Only a piece with a slip behind it can be read. There is nothing
         to turn over on an ordinary one — the paper is the whole signal,
         and a look that found nothing would just be a worse way of
         pulling. */
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

    /* A slip riding line 5 with nothing under it. It is released on the
       same belt, travels at the same speed, and goes out at the end of the
       line like everything else if nobody picks it up. */
    releaseSlip: function (clue) {
      /* Deliberately not counted in shift.returns. That number is what the
         line released and what the operator is answerable for; a slip of
         paper riding the belt is neither, and counting it made every
         accounting test on line 5 disagree with logic.returnCount. */
      this.returns.push({
        i: this.retIdx, x: LAY.retSpawnX, form: 0,
        bob: (D.rnd(this.retIdx * 5.7) - 0.5) * 4,
        faulty: false, armable: false, bare: true, clue: clue, past: false
      });
    },

    /* The slip left on a machine casing down the hall. Nobody is coming to
       collect it, so unlike everything else in the game it waits. */
    lookBg: function () {
      if (this.open) { this.lastAction = 'reading'; return false; }
      // the circular's own slip sits in the same place and comes first
      if (this.revealBg) return this.takeReveal();
      if (!this.bgUp) { this.lastAction = 'nobg'; return false; }
      var clue = this.bgUp;
      this.bgUp = null;
      this.shift.looked++;
      this.lastAction = 'found';
      return this.read_(clue);
    },

    /* Either half of the pair, and both go with it. There is only one
       circular and it does not matter which hand found it. */
    takeReveal: function () {
      if (this.open || this.run.revealed) return false;
      this.run.revealTaken = true;
      this.revealBg = false;
      this.returns = this.returns.filter(function (r) { return !r.reveal; });
      this.shift.looked++;
      this.lastAction = 'found';
      return this.read_(L.REVEAL);
    },

    /* The banner behind the aeroplane. It crosses the window band once. */
    lookPlane: function () {
      if (this.open) { this.lastAction = 'reading'; return false; }
      if (!this.planeUp) { this.lastAction = 'noplane'; return false; }
      var clue = this.planeUp;
      this.planeUp = null;
      this.shift.looked++;
      this.lastAction = 'found';
      return this.read_(clue);
    },

    /* The yard camera, and the one channel that is a picture rather than a
       document. Looking at it does not stop the shift and does not open a
       card over the hall: you turn your head, you see four lorries and one
       of them is not one of theirs, and the line goes on running behind
       you. CLUES.md is explicit that this is a visual and not an
       interruption, and it is right — the thing ninety-five scrip buys is
       having to be looking, not having something read out at you.

       It costs no cycle and no clock. What it costs is the ninety-five,
       and the seconds your eyes were in the wrong corner. */
    lookDock: function () {
      if (this.open) { this.lastAction = 'reading'; return false; }
      if (!this.kit || !this.kit.dock) { this.lastAction = 'nodock'; return false; }
      if (!this.dockUp) {
        this.lastAction = 'dockidle';
        this.say(C.DOCK_IDLE, 1.8, 'dock');
        return false;
      }
      if (this.dockRead) { this.lastAction = 'dockseen'; return false; }
      this.dockRead = true;
      this.shift.looked++;
      this.lastAction = 'found';
      L.recordClue(this.run, this.shift, this.dockUp);
      SOL.audio.turn && SOL.audio.turn();
      return true;
    },

    /* Going over to the monitor rather than glancing at it from the press.
       The black one is the only thing in the game worth a second look, and
       it is worth exactly one point. */
    lookLorry: function () {
      if (this.open || !this.dockUp || !this.dockRead || this.dockCloser) {
        return false;
      }
      this.dockCloser = true;
      this.run.awareness += (this.dockUp.clickWeight || 0);
      SOL.audio.reveal && SOL.audio.reveal();
      return true;
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
      /* A slip on a machine casing is the one thing in the game that waits
         — nothing comes to take it away — so it has to be written off here
         instead. Left out, three items a run were counted as put within
         reach and never counted as missed, and the two figures on the
         sheet stopped adding up. */
      if (this.bgUp) { sh.marksPassed++; this.bgUp = null; }
      sh.marksPassed += this.bgQ.length;
      this.bgQ = [];
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
      // the basket needs move and up; nothing else does
      if (type !== 'down' && !this.bin) return;

      if (this.open) {
        if (hit && hit.id === 'close') this.closeInquiry();
        if (hit && hit.id === 'closer') this.lookCloser(g);
        return;
      }
      /* The basket is a drag, so it is the only screen in the build that
         cares about anything other than 'down'. */
      if (this.bin) {
        if (type === 'move') { this.dragItem(x, y); return; }
        if (type === 'up') { this.dropItem(g); return; }
        if (hit && hit.id === 'binclose') { this.closeBin(g); return; }
        if (hit && hit.id.indexOf('sort:') === 0) {
          this.grabItem(parseInt(hit.id.slice(5), 10), x, y, g);
        }
        return;
      }
      if (hit && hit.id === 'bin') { this.openBin(g); return; }
      if (hit && hit.id === 'stop') { this.stopLine(g); return; }
      if (hit && hit.id === 'lorry') { this.lookLorry(); return; }
      if (hit && hit.id === 'dock') { this.lookDock(); return; }
      if (hit && hit.id === 'bgslip') { this.lookBg(); return; }
      if (hit && hit.id === 'plane') { this.lookPlane(); return; }
      /* Line 5, and clicking it only ever looks. Taking a piece off is X
         and nothing but X.

         It used to do both — read a marked piece, take off anything else —
         and that made the same gesture mean two opposite things depending
         on something the player was still learning to see. A player who
         misread a split lost the piece they were trying to read, which is
         the one mistake this mechanic cannot afford to punish. Looking is
         now free of consequence and taking off is a separate decision made
         with a separate hand. */
      if (y >= LAY.retY - 44 && y <= LAY.retY + LAY.retH + 16) {
        this.look(x);
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

      /* An aeroplane across the window band, drawn against the hall and
         under everything else. It is small, it is far away, and it is the
         only thing in the game that happens outside the building. */
      if (this.planeUp) {
        var pt = D.clamp(this.planeT / PLANE_WINDOW, 0, 1);
        // right to left, with the banner trailing behind it
        var px = W + 80 - pt * (W + 160);
        ctx.save();
        ctx.globalAlpha = 0.85;
        // the aircraft: a dark speck, no detail at this distance
        ctx.fillStyle = 'rgba(28,32,35,0.95)';
        ctx.fillRect(px - 6, PLANE.y - 1.5, 12, 3);
        ctx.fillRect(px - 1.5, PLANE.y - 5, 3, 10);
        // and the banner it is dragging
        drawSlip(ctx, px + 30, PLANE.y + 1, PLANE.w, PLANE.h, 0.03,
          g.hoverId === 'plane');
        // put the glass back in front of it
        S.reglaze(ctx, W, cfg.mood);
        ctx.restore();
        this.hits.push({
          x: px - 16, y: PLANE.y - 18, w: PLANE.w + 74, h: 36, id: 'plane'
        });
      }

      // line 5 first: it is upstage, so everything else is drawn over it
      drawReturnLine(ctx, t, cfg, this.kit && this.kit.lamp, this.retPhase);
      for (var r = 0; r < this.returns.length; r++) {
        drawReturn(ctx, this.returns[r], t, this.kit || {});
      }

      /* A slip left on a machine casing down the hall, behind line 5 and
         well away from anything the player has to hit in a hurry. It does
         not move and nothing takes it away. */
      if (this.revealBg) {
        // the circular's own, on the same casing and impossible to take for
        // one of the ordinary ones
        drawSlip(ctx, BGSLIP.x, BGSLIP.y - 4, 40, 29, -0.05,
          g.hoverId === 'bgslip', true);
        this.hits.push({
          x: BGSLIP.x - 34, y: BGSLIP.y - 34, w: 68, h: 62, id: 'bgslip'
        });
      } else if (this.bgUp) {
        drawSlip(ctx, BGSLIP.x, BGSLIP.y, BGSLIP.w, BGSLIP.h, -0.06,
          g.hoverId === 'bgslip');
        this.hits.push({
          x: BGSLIP.x - BGSLIP.w, y: BGSLIP.y - BGSLIP.h,
          w: BGSLIP.w * 2, h: BGSLIP.h * 2, id: 'bgslip'
        });
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
        drawDock(ctx, t, !!this.dockUp,
          g.hoverId === 'lorry' ? 'lorry' : g.hoverId,
          this.dockRead, this.dockCloser);
        this.hits.push({ x: DOCK.x, y: DOCK.y, w: DOCK.w, h: DOCK.h, id: 'dock' });

        /* What the picture says, on a plate under the monitor, for as long
           as the lorry is in the yard. It went out as transient notices at
           first and three of them — the alert, the item, the second look —
           landed on the same anchor within a few seconds and printed
           through each other. A caption that belongs to the monitor is
           also simply where a caption belongs. */
        if (this.dockUp && this.dockRead) {
          var cap = [this.dockUp.lines[0]];
          if (this.dockCloser) cap.push(this.dockUp.clickLines[0]);
          var capOpt = { size: 10, lineHeight: 14, color: P.text };
          var rows = [];
          cap.forEach(function (line) {
            rows = rows.concat(D.wrap(ctx, line, DOCK.w - 16, capOpt));
          });
          var capH = rows.length * 14 + 16;
          var capY = DOCK.y + DOCK.h + 28;
          D.plate(ctx, DOCK.x - 8, capY, DOCK.w + 16, capH,
            { top: '#25292c', bot: '#16181a', r: 2 });
          rows.forEach(function (line, k) {
            D.txt(ctx, line, DOCK.x, capY + 18 + k * 14, capOpt);
          });
        }
        /* The black one is its own target once the picture has been read,
           and it sits in front of the monitor's own region so a click on
           it is a click on it and not on the screen generally. */
        if (this.dockUp && this.dockRead && !this.dockCloser) {
          this.hits.unshift({
            x: BLACK.x - 4, y: BLACK.y - 4, w: BLACK.w + 8, h: BLACK.h + 8,
            id: 'lorry'
          });
        }
      }
      if (this.open && this.open.clue.reveal) this.drawRevealLetter(ctx, t, g);
      else if (this.open) this.drawInquiry(ctx, t, g);
      else if (this.bin) this.drawSort(ctx, t, g);
      else this.drawRadio(ctx, t);
      Screens._footerRail(ctx, this.footerHint());
      D.crt(ctx, W, H, t);
    },

    /* The basket, tipped out. Two chutes, one down each side of the card,
       and twenty things scattered between them: drag the paper right and
       everything else left. None of them is labelled — the label used to
       say BATCH CARD or SWARF under each one, which meant the sort was
       reading twenty words rather than looking at twenty things.

       One of them has something written on it. Picking that one up opens
       it in your hand before you have decided which chute it was for,
       which is the only reason to touch any of this. */
    drawSort: function (ctx, t, g) {
      var b = this.bin;
      var nx = SORT.x, nw = SORT.w, px = nx + 44, pw = nw - 88;
      var nh = SORT.top + SORT.bodyH + 26 + 46 + 26;
      var ny = Math.round((H - nh) / 2) + 8;
      this.card = { x: nx, y: ny, w: nw, h: nh };

      ctx.fillStyle = 'rgba(11,14,16,0.72)';
      ctx.fillRect(0, 0, W, H);
      Screens._notice(ctx, nx, ny, nw, nh, C.BIN_HEADING);

      var y = ny + 42;
      D.txt(ctx, C.BIN_TITLE, px, y,
        { size: 20, weight: 600, family: 'sans', color: P.bright, track: 3.4 });
      y += 20;
      D.stencil(ctx, C.BIN_SUB, px, y, { size: 9.5, track: 2.2, color: P.faint });
      y += 12;
      D.seam(ctx, px, y, pw);

      /* The two chutes. Drawn as the mouths of things rather than as
         buttons, because they are not buttons: you cannot click them, only
         let go over them. */
      var bodyY = ny + SORT.top, bodyH = SORT.bodyH;
      var mid = nx + nw / 2;
      var chuteW = 132;
      [[nx + 18, C.BIN_CHUTE_LEFT], [nx + nw - 18 - chuteW, C.BIN_CHUTE_RIGHT]]
        .forEach(function (c, k) {
          var over = b.drag &&
            ((k === 0) === (b.drag.x < mid));
          D.plate(ctx, c[0], bodyY, chuteW, bodyH, over
            ? { top: '#454b50', bot: '#2a2e32', r: 3 }
            : { top: '#252a2d', bot: '#171a1c', r: 3 });
          ctx.strokeStyle = over ? 'rgba(226,238,246,0.7)' : 'rgba(0,0,0,0.6)';
          ctx.lineWidth = over ? 2 : 1;
          ctx.strokeRect(c[0] + 0.5, bodyY + 0.5, chuteW - 1, bodyH - 1);
          D.stencil(ctx, c[1], c[0] + chuteW / 2, bodyY + bodyH / 2,
            { size: over ? 11 : 10, track: 2.6, align: 'center',
              color: over ? P.bright : P.dim });
        });

      // the dividing line the sort is actually about
      ctx.fillStyle = 'rgba(120,132,142,0.16)';
      ctx.fillRect(mid - 0.5, bodyY + 8, 1, bodyH - 16);

      b.items.forEach(function (it, i) {
        if (it.gone) return;
        var held = b.drag && b.drag.idx === i;
        var cx = held ? b.drag.x : nx + it.x * nw;
        var cy = held ? b.drag.y : bodyY + it.y * bodyH;
        if (it.wrong > 0) {
          // shaken off, on its way back to where it was lying
          cx += Math.sin(it.wrong * 42) * 5 * it.wrong;
        }
        var hot = held || g.hoverId === 'sort:' + i;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(it.rot);
        if (held) {
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 8;
          ctx.shadowOffsetY = 4;
        }
        if (it.kind === 'paper') {
          /* A ball of paper. The one with something on it is the same warm
             cast as a slip on the line — nothing else marks it. */
          ctx.fillStyle = it.marked
            ? (hot ? 'rgba(201,183,175,0.7)' : 'rgba(174,157,150,0.56)')
            : (hot ? 'rgba(196,190,178,0.66)' : 'rgba(168,163,152,0.5)');
          ctx.beginPath();
          for (var k = 0; k < 9; k++) {
            var a = (k / 9) * 6.28;
            var rr = 15 + D.rnd(i * 5.1 + k) * 5;
            ctx[k ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
          }
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(90,86,78,0.45)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-9, -4); ctx.lineTo(3, 2); ctx.lineTo(-4, 9);
          ctx.moveTo(7, -8); ctx.lineTo(1, 1);
          ctx.stroke();
        } else {
          ctx.strokeStyle = hot ? 'rgba(176,186,194,0.74)' : 'rgba(140,150,158,0.54)';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          for (var q = 0; q < 26; q++) {
            var aa = q * 0.42, rr2 = 3 + q * 0.5;
            ctx[q ? 'lineTo' : 'moveTo'](Math.cos(aa) * rr2, Math.sin(aa) * rr2 * 0.7);
          }
          ctx.stroke();
        }
        ctx.restore();

        /* Unshifted, not pushed. Items are drawn in index order so a later
           one lies on top of an earlier one, and `pointer` takes the first
           region it matches — pushing meant a click on an overlap grabbed
           the thing underneath the thing you were looking at. */
        this.hits.unshift({ x: cx - 20, y: cy - 20, w: 40, h: 40, id: 'sort:' + i });
      }, this);

      var b2 = { x: px - 14, y: ny + nh - 46 - 26, w: 250, h: 46, id: 'binclose' };
      Screens._control(ctx, b2, b.left > 0 ? C.BIN_LEAVE : C.BIN_DONE_BTN,
        g.hoverId === 'binclose' ? 'hover' : 'idle', { size: 12 });
      this.hits.push(b2);
      D.stencil(ctx, C.BIN_NOTE, px + pw, ny + nh - 46,
        { size: 9, track: 1.6, color: 'rgba(112,120,127,0.95)', align: 'right' });
      D.stencil(ctx, b.left + ' ' + C.BIN_LEFT, px + pw, ny + nh - 28,
        { size: 9, track: 1.6, color: P.faint, align: 'right' });
    },

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
      // the second look, when there is one, gets its own row's worth
      var nh = 78 + 26 + 24 + bodyH + 18 + 40 + 26 + 22 +
        (clue.clickLines ? 46 : 0);
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

      /* The second look. Only the yard camera has one, and only once the
         card itself has been read to the end — a closer look at something
         you did not finish reading is not a closer look at anything. */
      if (clue.clickLines && o.read) {
        if (o.closer) {
          y = D.para(ctx, clue.clickLines[0], px, y + 12, pw, {
            size: lineOpt.size, lineHeight: lineOpt.lineHeight, color: P.text
          }) + 2;
        } else {
          var cb = { x: px - 14, y: y + 12, w: 300, h: 34, id: 'closer' };
          Screens._control(ctx, cb, C.INQUIRY_CLOSER,
            g.hoverId === 'closer' ? 'hover' : 'idle', { size: 11 });
          this.hits.push(cb);
          y = cb.y + cb.h + 4;
        }
      }

      /* There is no cost readout any more. It counted the seconds spent
         with a card open, and once the clock was put on the same rate as
         the belt those seconds stopped costing anything — so a running
         total of them was a bill for nothing, sitting in the corner of
         every document in the game telling the player off. */
      var by = ny + nh - 82;
      D.seam(ctx, px, by - 12, pw);

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

    /* The circular, and the only item in the build that is not read on the
       station's own grey card. It is a torn-off piece of the customer's
       letterhead, so it is drawn as one: cream stock, the office's device
       struck at the head of it, and a table of factory assignments set out
       the way a clerk would set it out. The same sheet the last screen of
       the run is written on, six shifts early and torn in half.

       Reusing the letter screen's paper and its seal is the point. When the
       closing letter arrives the player has seen this stock once before,
       and knows what it means before they have read a word of it. */
    drawRevealLetter: function (ctx, t, g) {
      var o = this.open, clue = o.clue;
      var PAPER = '#cfccc4', PAPER_LO = '#b6b3ab', INK = '#2b2a25';

      ctx.fillStyle = 'rgba(11,14,16,0.78)';
      ctx.fillRect(0, 0, W, H);

      var nw = 640, nx = Math.round((W - nw) / 2);
      var lineOpt = { size: 13, lineHeight: 21, color: INK, family: 'mono' };
      var rows = clue.lines.map(function (str) {
        return D.wrap(ctx, str, nw - 108, lineOpt).length;
      });
      var bodyH = rows.reduce(function (a, n) { return a + n * 21 + 14; }, 0);
      var nh = (clue.source ? 120 : 102) + bodyH + 30 + 44 + 26;
      var ny = Math.round((H - nh) / 2) + 6;
      this.card = { x: nx, y: ny, w: nw, h: nh };

      // the sheet, and the tear along the foot of it
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(nx, ny);
      ctx.lineTo(nx + nw, ny);
      ctx.lineTo(nx + nw, ny + nh - 12);
      for (var tx = nw; tx >= 0; tx -= 16) {
        ctx.lineTo(nx + tx, ny + nh - 12 + (D.rnd(tx * 0.7) - 0.5) * 11);
      }
      ctx.closePath();
      ctx.clip();
      D.vgrad(ctx, nx, ny, nw, nh, PAPER, PAPER_LO);
      // the tooth of the stock
      ctx.fillStyle = 'rgba(120,114,100,0.05)';
      for (var fy = ny; fy < ny + nh; fy += 3) ctx.fillRect(nx, fy, nw, 1);
      ctx.restore();

      var px = nx + 54, y = ny + 44;

      /* The device, struck small and off square at the head of the sheet.
         It is the one thing in the build that carries the symbol before the
         last screen, and it is here because this is the item that names the
         thing — it is the object of the reveal, not decoration on it. */
      Screens.letter && Screens.letter.drawSeal &&
        Screens.letter.drawSeal(ctx, nx + nw - 92, ny + 46, 116);

      D.txt(ctx, clue.kind, px, y,
        { size: 15, weight: 600, family: 'sans', color: INK, track: 3.2 });
      // no subtitle on this one: the heading is the whole of the head
      y += clue.source ? 18 : 4;
      if (clue.source) {
        D.stencil(ctx, clue.source, px, y,
          { size: 9, track: 1.5, color: 'rgba(70,66,58,0.85)' });
        y += 22;
      } else {
        y += 18;
      }
      ctx.fillStyle = 'rgba(70,66,58,0.35)';
      ctx.fillRect(px, y, nw - 108, 1);
      y += 12;

      /* One row per factory. Where each one lands is recorded as it is
         drawn, so the pencil ring can be hung off the right row rather than
         off whichever happened to be last. */
      var rowAt = [];
      for (var i = 0; i < clue.lines.length; i++) {
        if (i >= o.shown) break;
        var age = o.t - (L.CLUE_LEAD + i * L.CLUE_LINE);
        var a = D.clamp(age / 0.55, 0, 1);
        var top = y + 10;
        rowAt[i] = {
          top: top,
          w: D.measure(ctx, clue.lines[i], { size: lineOpt.size, family: 'mono' })
        };
        y = D.para(ctx, clue.lines[i], px, top, nw - 108, {
          size: lineOpt.size, lineHeight: lineOpt.lineHeight,
          family: 'mono', color: INK, alpha: 0.2 + 0.8 * a
        }) + 1;
      }

      /* Somebody has been round the seventh row twice in pencil. Drawn
         rather than written about, because a circle in a table is a gesture
         and not a sentence. It was anchored to the last row for a revision,
         which is why the table used to be out of order. */
      var ring = clue.circled != null ? rowAt[clue.circled] : null;
      if (ring) {
        var cx0 = px - 8, cx1 = px + ring.w + 8;
        var ccx = (cx0 + cx1) / 2, crx = (cx1 - cx0) / 2;
        ctx.save();
        ctx.strokeStyle = 'rgba(58,54,48,0.5)';
        ctx.lineWidth = 1.4;
        for (var pass = 0; pass < 2; pass++) {
          ctx.beginPath();
          ctx.ellipse(ccx + pass * 2, ring.top - 4 + pass,
            crx - pass * 3, 13 - pass, 0.015 * pass, 0, 6.3);
          ctx.stroke();
        }
        ctx.restore();
      }

      var b = { x: px - 10, y: ny + nh - 72, w: 264, h: 42, id: 'close' };
      D.plate(ctx, b.x, b.y, b.w, b.h, g.hoverId === 'close'
        ? { top: '#c2beb4', bot: '#a9a59c', r: 2 }
        : { top: '#b8b4aa', bot: '#a19d94', r: 2 });
      D.txt(ctx, o.read ? C.INQUIRY_CLOSE_DONE : C.INQUIRY_CLOSE_EARLY,
        b.x + 22, b.y + 27,
        { size: 12, weight: 600, family: 'sans', color: INK, track: 2.6 });
      this.hits.push(b);

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
