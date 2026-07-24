export function computeF1(failedParams: number, totalParams: number): number {
  return totalParams === 0 ? 0 : (failedParams / totalParams) * 100
}

export function computeF2(failedTests: number, totalTests: number): number {
  return totalTests === 0 ? 0 : (failedTests / totalTests) * 100
}

export function computeNse(excursions: number[], totalTests: number): number {
  if (totalTests === 0) return 0
  const sum = excursions.reduce((a, b) => a + b, 0)
  return sum / totalTests
}

export function computeF3(nse: number): number {
  if (nse <= 0) return 0
  return nse / (0.01 * nse + 0.01)
}

export function computeWQI(f1: number, f2: number, f3: number): number {
  return 100 - Math.sqrt(f1 * f1 + f2 * f2 + f3 * f3) / 1.732
}

export function category(wqi: number): string {
  if (wqi >= 95) return 'Excellent'
  if (wqi >= 80) return 'Good'
  if (wqi >= 65) return 'Fair'
  if (wqi >= 45) return 'Marginal'
  return 'Poor'
}
