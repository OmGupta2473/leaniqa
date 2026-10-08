export const CATEGORY_COLORS = {
  streak:    '#FF4D1C',
  logging:   '#2E9CFF',
  protein:   '#8E5CF7',
  precision: '#12C9A0',
  weight:    '#F0529C',
  milestone: '#D9A441',
} as const;

export type AwardCategory = keyof typeof CATEGORY_COLORS;