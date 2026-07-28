/* audio.js — procedurally generated, no asset files.
   Everything is oscillators and filtered noise so the build stays a
   single folder of text. Silent until the first user gesture, per
   browser autoplay policy. Expanded in the polish pass. */
(function (root) {
  'use strict';

  var SOL = root.SOL || (root.SOL = {});
  var A = SOL.audio = {};

  var ac = null, master = null, enabled = true, started = false;

  A.isEnabled = function () { return enabled; };
  A.setEnabled = function (v) {
    enabled = !!v;
    if (master) master.gain.value = enabled ? 0.9 : 0;
  };

  A.start = function () {
    if (started || !root.AudioContext && !root.webkitAudioContext) return;
    try {
      ac = new (root.AudioContext || root.webkitAudioContext)();
      master = ac.createGain();
      master.gain.value = enabled ? 0.9 : 0;
      master.connect(ac.destination);
      started = true;
    } catch (e) { ac = null; }
  };

  function ready() {
    if (!started) A.start();
    if (ac && ac.state === 'suspended') ac.resume();
    return !!ac && enabled;
  }

  function env(node, t0, a, d, peak) {
    var g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    node.connect(g);
    return g;
  }

  function noiseBuf(dur) {
    var n = Math.floor(ac.sampleRate * dur);
    var b = ac.createBuffer(1, n, ac.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  /* A short percussive hit: the press coming down. */
  A.stamp = function () {
    if (!ready()) return;
    var t0 = ac.currentTime;
    var o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(180, t0);
    o.frequency.exponentialRampToValueAtTime(48, t0 + 0.09);
    env(o, t0, 0.004, 0.12, 0.28).connect(master);
    o.start(t0); o.stop(t0 + 0.2);

    var s = ac.createBufferSource();
    s.buffer = noiseBuf(0.08);
    var bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 0.9;
    s.connect(bp);
    env(bp, t0, 0.002, 0.07, 0.10).connect(master);
    s.start(t0);
  };

  /* Soft click for menu movement. */
  A.tick = function () {
    if (!ready()) return;
    var t0 = ac.currentTime;
    var s = ac.createBufferSource();
    s.buffer = noiseBuf(0.03);
    var f = ac.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 1800;
    s.connect(f);
    env(f, t0, 0.001, 0.028, 0.06).connect(master);
    s.start(t0);
  };

  A.confirm = function () {
    if (!ready()) return;
    var t0 = ac.currentTime;
    var o = ac.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(320, t0);
    o.frequency.setValueAtTime(214, t0 + 0.055);
    var g = env(o, t0, 0.004, 0.11, 0.05);
    var lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1400;
    g.connect(lp); lp.connect(master);
    o.start(t0); o.stop(t0 + 0.18);
  };

  /* Dull, unsatisfying thud — scrapping is not rewarded by the sound. */
  /* The same press, not seated. Duller and shorter — the difference a
     foreman would hear from across the floor and an operator hears every
     time. Nothing about it is triumphant. */
  A.stampShort = function () {
    if (!ready()) return;
    var t0 = ac.currentTime;
    var o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(132, t0);
    o.frequency.exponentialRampToValueAtTime(58, t0 + 0.06);
    env(o, t0, 0.004, 0.07, 0.20).connect(master);
    o.start(t0); o.stop(t0 + 0.15);

    var s = ac.createBufferSource();
    s.buffer = noiseBuf(0.05);
    var lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 900;
    s.connect(lp);
    env(lp, t0, 0.002, 0.05, 0.06).connect(master);
    s.start(t0);
  };

  /* A lever thrown at the station. Metal, small, and final-sounding. */
  A.lever = function () {
    if (!ready()) return;
    var t0 = ac.currentTime;
    var s = ac.createBufferSource();
    s.buffer = noiseBuf(0.10);
    var bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.6;
    s.connect(bp);
    env(bp, t0, 0.002, 0.09, 0.13).connect(master);
    s.start(t0);
    var o = ac.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(310, t0);
    o.frequency.exponentialRampToValueAtTime(196, t0 + 0.05);
    env(o, t0, 0.003, 0.05, 0.05).connect(master);
    o.start(t0); o.stop(t0 + 0.12);
  };

  A.scrap = function () {
    if (!ready()) return;
    var t0 = ac.currentTime;
    var s = ac.createBufferSource();
    s.buffer = noiseBuf(0.22);
    var lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 420;
    s.connect(lp);
    env(lp, t0, 0.006, 0.2, 0.14).connect(master);
    s.start(t0);
  };

  /* Paper handled: a short dry rustle, no tone in it at all. */
  A.paper = function () {
    if (!ready()) return;
    var t0 = ac.currentTime;
    var s = ac.createBufferSource();
    s.buffer = noiseBuf(0.30);
    var bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.7;
    var hp = ac.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 900;
    s.connect(bp); bp.connect(hp);
    env(hp, t0, 0.02, 0.26, 0.05).connect(master);
    s.start(t0);
  };

  /* A line of an item resolving. Quieter and lower than the menu tick, so
     reading never feels like scoring. */
  A.reveal = function () {
    if (!ready()) return;
    var t0 = ac.currentTime;
    var o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(660, t0);
    var g = env(o, t0, 0.005, 0.10, 0.028);
    g.connect(master);
    o.start(t0); o.stop(t0 + 0.14);
  };

  /* ---------- line 5 ----------
     Everything at the return line used to borrow the scrap chute's thud or
     the menu's click, which meant three different acts sounded like two
     other acts. They are separated here because the whole of the second
     duty is telling one reach from another by feel. */

  /* Lifting a piece off the belt: a short scrape of metal on rubber and a
     light clack as it goes in the tray. Higher and drier than scrapping,
     which is a thing falling down a chute. */
  A.lift = function () {
    if (!ready()) return;
    var t0 = ac.currentTime;
    var s = ac.createBufferSource();
    s.buffer = noiseBuf(0.09);
    var bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 1.1;
    s.connect(bp);
    env(bp, t0, 0.004, 0.08, 0.09).connect(master);
    s.start(t0);
    var o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(520, t0 + 0.05);
    o.frequency.exponentialRampToValueAtTime(340, t0 + 0.10);
    env(o, t0 + 0.05, 0.003, 0.06, 0.05).connect(master);
    o.start(t0 + 0.05); o.stop(t0 + 0.16);
  };

  /* Turning a piece over and finding nothing on it. Deliberately the least
     interesting sound in the build: it is what most looking gets you. */
  A.turn = function () {
    if (!ready()) return;
    var t0 = ac.currentTime;
    var s = ac.createBufferSource();
    s.buffer = noiseBuf(0.07);
    var bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 780; bp.Q.value = 0.8;
    s.connect(bp);
    env(bp, t0, 0.006, 0.06, 0.045).connect(master);
    s.start(t0);
  };

  /* The feeder's strike. The same press, heard from a machine that is not
     you: a shade quieter, and without the ring the hand strike has. */
  A.stampAuto = function () {
    if (!ready()) return;
    var t0 = ac.currentTime;
    var o = ac.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(168, t0);
    o.frequency.exponentialRampToValueAtTime(52, t0 + 0.08);
    env(o, t0, 0.004, 0.10, 0.17).connect(master);
    o.start(t0); o.stop(t0 + 0.18);
  };

  /* A line arriving on the bench set. Band-limited to about what a small
     mains receiver could manage, and quiet enough to be missed. */
  A.radio = function () {
    if (!ready()) return;
    var t0 = ac.currentTime;
    var o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(430, t0);
    o.frequency.linearRampToValueAtTime(390, t0 + 0.09);
    var g = env(o, t0, 0.012, 0.09, 0.022);
    var bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 0.6;
    g.connect(bp); bp.connect(master);
    o.start(t0); o.stop(t0 + 0.13);
  };

  /* The line itself: a low continuous hum plus filtered noise, held for
     as long as the shift screen is up. */
  var line = null;
  A.lineOn = function () {
    if (!ready() || line) return;
    var g = ac.createGain();
    g.gain.value = 0.0001;
    g.gain.linearRampToValueAtTime(0.10, ac.currentTime + 1.2);
    g.connect(master);

    var o1 = ac.createOscillator();
    o1.type = 'sawtooth'; o1.frequency.value = 47;
    var lp = ac.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 190;
    o1.connect(lp); lp.connect(g);

    var n = ac.createBufferSource();
    n.buffer = noiseBuf(2.5); n.loop = true;
    var bp = ac.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.5;
    var ng = ac.createGain(); ng.gain.value = 0.035;
    n.connect(bp); bp.connect(ng); ng.connect(g);

    o1.start(); n.start();
    line = { g: g, nodes: [o1, n] };
  };

  A.lineOff = function () {
    if (!line || !ac) return;
    var l = line; line = null;
    try {
      l.g.gain.cancelScheduledValues(ac.currentTime);
      l.g.gain.setValueAtTime(l.g.gain.value, ac.currentTime);
      l.g.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.35);
      l.nodes.forEach(function (n) { try { n.stop(ac.currentTime + 0.45); } catch (e) {} });
    } catch (e) {}
  };

  A.stop = function () {
    if (ac) { try { ac.close(); } catch (e) {} ac = null; started = false; }
  };

})(typeof window !== 'undefined' ? window : globalThis);
