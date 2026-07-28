/* Palette — charcoal / graphite / soot.
   One accent only: a low, lamp-coloured amber reserved for inquiry.
   Nothing else in the build may use it. */
(function (root) {
  'use strict';

  var SOL = root.SOL || (root.SOL = {});

  SOL.P = {
    // structure
    void:     '#050607',
    bg:       '#0b0d0f',
    bgHi:     '#131619',
    floor:    '#0f1114',
    plate:    '#15181b',
    plateHi:  '#1b2024',
    steel:    '#272d32',
    steelHi:  '#343b41',
    steelLo:  '#171b1e',
    beltDark: '#101315',
    belt:     '#1a1e22',
    beltHi:   '#252b30',
    edgeHi:   '#3b434a',
    edgeLo:   '#040506',

    // type
    faint:    '#464e55',
    dim:      '#68727a',
    mid:      '#8d969e',
    text:     '#bfc7cd',
    bright:   '#e6ebee',
    white:    '#f4f7f9',

    // the one thing letting light in
    accent:   '#c8912e',
    accentHi: '#efc274',
    accentLo: '#6a4d18',

    // alarm greys — used for failure states; deliberately NOT red
    warnLo:   '#3a3f43',
    warn:     '#9aa2a8'
  };

  // Canonical stage size. Everything lays out against this.
  SOL.W = 1200;
  SOL.H = 750;

  SOL.FONT = {
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
    sans: '"Helvetica Neue", Helvetica, Arial, sans-serif'
  };

})(typeof window !== 'undefined' ? window : globalThis);
