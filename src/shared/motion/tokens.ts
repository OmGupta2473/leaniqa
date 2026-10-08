export const SPRING = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 },
  gentle: { type: 'spring', stiffness: 200, damping: 25 },
  bouncy: { type: 'spring', stiffness: 500, damping: 18 },
  tap:    { type: 'spring', stiffness: 500, damping: 25 },
  sheet:  { type: 'spring', stiffness: 300, damping: 30 },
  reveal: { type: 'spring', stiffness: 250, damping: 28 },
} as const;


export const EASE_OUT = [0.16, 1, 0.3, 1] as const;


export const PRESSED = { scale: 0.97 } as const;
export const PRESSED_SUBTLE = { scale: 0.98, opacity: 0.9 } as const;
export const HOVER_LIFT = { y: -2 } as const;

export type SpringToken = keyof typeof SPRING;
