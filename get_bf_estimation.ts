export function estimateBodyFat(weightKg: number, heightCm: number, age: number, gender: string): number {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  if (gender === 'Male') {
    return (1.20 * bmi) + (0.23 * age) - 16.2;
  } else {
    return (1.20 * bmi) + (0.23 * age) - 5.4;
  }
}
