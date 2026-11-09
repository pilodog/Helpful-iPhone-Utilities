// Tempo grid + cue times: the single source of truth for picture, score, mix and subtitles.
export const BPM = 100, BEAT = 0.6, BAR = 2.4;
export const VO = { // voice start times (on the beat grid)
  L01: 0.9, L02: 6.0, L03: 12.6, L04: 22.8, L05: 29.4, L06: 34.8, L07: 37.8, L08: 41.4, L09: 46.8,
  L10: 53.4, L11: 57.0, L12: 63.0, L13: 69.0, L14: 76.8, L15: 83.4, L16: 91.2, L17: 96.0,
};
export const TL = {
  // hook
  TOUCH_A: 1.8, WALK0: 3.0, WALK1: 6.6, TOUCH_B: 7.2, PUSH0: 8.4, PUSH1: 10.2, HOOK_END: 12.0,
  // number board
  NUM0: 12.0, ICON0: 13.2, ICON_STEP: 0.15, SIL1: 20.7, CLICK: 21.6,
  // hands ready
  READY0: 21.6, NAILS: 24.6, RING: 25.8, BRACELET: 26.4, WATCH: 27.0, GLOVE: 29.4, NOTEQ: 31.2, READY_END: 34.2,
  // five moments
  ROOM0: 34.2, ZONE0: 34.8, ZONE1: 37.2,
  M1: 37.8, M2: 41.4, M3: 46.8, M4: 53.4, M5: 57.0, MOM_END: 62.4,
  // hand rub
  RUB0: 62.4, GEL: 63.6, STEPS0: 67.2, STEP: 1.5, RUB_END: 76.2,
  // hand wash
  JWATER: 75.6, WASH0: 76.2, TAP_ON: 77.4, SOAP: 79.8, RINSE: 84.6, DRY: 86.1, TAP_OFF: 87.6, SIL2: 89.4, WASH_END: 90.0,
  // finale
  FIN0: 90.0, FIN_WALK0: 90.6, FIN_GEL: 92.4, FIN_WALK1: 93.6, PULL0: 94.2, PULL1: 97.2, LIGHTS0: 94.8, CARD: 97.8, END: 102.0,
};
TL.ICONS = [...Array(50)].map((_, i) => +(TL.ICON0 + i * TL.ICON_STEP).toFixed(3));       // 13.20 … 20.55, one per 16th
TL.STEPS = [...Array(6)].map((_, i) => +(TL.STEPS0 + i * TL.STEP).toFixed(3));           // 67.2 … 74.7
TL.LIGHTS = [...Array(6)].map((_, i) => +(TL.LIGHTS0 + i * 0.3).toFixed(3));             // 8th notes
export const DUR = TL.END;
