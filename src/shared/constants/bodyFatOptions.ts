export interface BodyFatOption {
  range: string;
  label: string;
  characteristics: string[];
  mid: number;
}

export const maleOptions: BodyFatOption[] = [
  { range: 'Under 8%', label: 'Essential fat', characteristics: ['Extremely lean', 'Visible striations', 'Competition level'], mid: 5 },
  { range: '8–12%', label: 'Athletic', characteristics: ['Visible abs', 'Very defined', 'Typical fitness model'], mid: 10 },
  { range: '12–15%', label: 'Fit', characteristics: ['Some ab definition', 'Lean look', 'Low belly fat'], mid: 13.5 },
  { range: '15–20%', label: 'Average fit', characteristics: ['Slight lower belly', 'Face appears lean', 'Waist visible', 'No visible abs'], mid: 17.5 },
  { range: '20–25%', label: 'Average', characteristics: ['Soft belly', 'Fuller face', 'No muscle definition'], mid: 22.5 },
  { range: '25–30%', label: 'Above average', characteristics: ['Noticeable belly', 'Rounder build', 'Love handles'], mid: 27.5 },
  { range: '30–40%', label: 'High body fat', characteristics: ['Significant fat storage', 'Round face', 'High waist circumference'], mid: 35 },
  { range: 'Above 40%', label: 'Obese', characteristics: ['Excessive fat storage across whole body', 'Health risks'], mid: 45 }
];

export const femaleOptions: BodyFatOption[] = [
  { range: 'Under 14%', label: 'Essential fat', characteristics: ['Extremely lean', 'Visible striations', 'Competition level'], mid: 12 },
  { range: '14–20%', label: 'Athletic', characteristics: ['Visible abs', 'Very defined', 'Typical fitness model'], mid: 17 },
  { range: '20–24%', label: 'Fit', characteristics: ['Some definition', 'Lean look', 'Low belly fat'], mid: 22 },
  { range: '24–30%', label: 'Average fit', characteristics: ['Slight lower belly', 'Face appears lean', 'Waist visible', 'No visible abs'], mid: 27 },
  { range: '30–35%', label: 'Average', characteristics: ['Soft belly', 'Fuller face', 'No muscle definition'], mid: 32.5 },
  { range: '35–40%', label: 'Above average', characteristics: ['Noticeable belly', 'Rounder build', 'Love handles'], mid: 37.5 },
  { range: '40–50%', label: 'High body fat', characteristics: ['Significant fat storage', 'Round face', 'High waist circumference'], mid: 45 },
  { range: 'Above 50%', label: 'Obese', characteristics: ['Excessive fat storage across whole body', 'Health risks'], mid: 55 }
];
