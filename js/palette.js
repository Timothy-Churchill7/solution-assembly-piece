/* Palette — graphite and steel, no colour in it at all.
   One accent only: a low, lamp-coloured amber reserved for inquiry.
   Nothing else in the build may use it.

   The first cut of this was charcoal and soot, and it was too dark to work
   in: the hall read as a black rectangle with instruments floating on it,
   and by the sixth shift — where `mood` is lowest — the pieces on the belt
   you are meant to be inspecting were very nearly gone. Every structural
   grey below has been lifted, keeping the same ordering and the same cool
   tint, so the room is legible without becoming bright. It is still a
   night shift in a badly lit building; you can just see it now. */
(function (root) {
  'use strict';

  var SOL = root.SOL || (root.SOL = {});

  SOL.P = {
    // structure
    void:     '#0e0f10',
    bg:       '#181a1c',
    bgHi:     '#272a2d',
    floor:    '#1d1f21',
    plate:    '#242729',
    plateHi:  '#2e3134',
    steel:    '#3c4145',
    steelHi:  '#4e5357',
    steelLo:  '#272a2d',
    beltDark: '#1f2122',
    belt:     '#2c2f32',
    beltHi:   '#3a3e42',
    edgeHi:   '#565c60',
    edgeLo:   '#0c0d0d',

    /* `faint` carries every low-priority label in the build — the console
       sub-rail, the conveyor signage, the small print on the notices. On
       the old charcoal it read as a whisper; on this palette it read as
       nothing at all, so it is lifted furthest of any type colour. */
    faint:    '#787d81',
    dim:      '#8f9497',
    mid:      '#a1a6aa',
    text:     '#cfd3d5',
    bright:   '#f0f2f3',
    white:    '#f9fafa',

    /* Red, and the only red on the working screens. It marks a thing that
       has something on it — a piece coming down line 5 that somebody has
       been at, a balled-up paper in the bin. It is a marker and nothing
       else: it never carries meaning of its own, and the seal on the
       closing letter is a different red for a different reason.

       Twice as dull as it started. The first cut was a signal red and it
       carried across the whole hall, which made every taped piece read as
       something the game wanted from you rather than something somebody
       on an earlier shift had done and forgotten. This is oxide on old
       tape under a factory lamp: you find it by looking at the belt, not
       by having it shouted at you. */
    mark:     '#8c4a41',
    markLo:   '#5e2f2a',

    /* Paper. The one warm colour on a working screen and the only thing
       that says an item can be read. It is not a signal colour, it is the
       colour of a docket in a building where everything else is steel. */
    paper:    '#d8cfb4',
    paperHi:  '#efe7cd',
    /* The centre of the glint. Brighter than `mark` on purpose: once the
       mark came down to two pixels by nine it stopped being paint on a
       part and became light catching one, and light is the one thing that
       is allowed to be bright. Dull at that size is invisible. */
    markHi:   '#c9584a',

    // the one thing letting light in
    accent:   '#c8912e',
    accentHi: '#efc274',
    accentLo: '#6a4d18',

    // alarm greys — used for failure states; deliberately NOT red
    warnLo:   '#4e5254',
    warn:     '#adb2b5'
  };

  // Canonical stage size. Everything lays out against this.
  SOL.W = 1200;
  SOL.H = 750;

  SOL.FONT = {
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
    sans: '"Helvetica Neue", Helvetica, Arial, sans-serif'
  };

})(typeof window !== 'undefined' ? window : globalThis);
