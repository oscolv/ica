// Fórmulas extraídas por ingeniería inversa del binario oficial CCMEWQI.exe
// (métodos Calc_Cd, Calc_Cu, Calc_Ni, Calc_Pb, Calc_Zn, Calc_AlCCME, Calc_Ammonia)
// y verificadas contra el ejemplo del manual. H = dureza (mg/L CaCO3); T = °C.

/** Cadmio (µg/L). H<17 -> 0.04; H>280 -> 0.37; si no 10^(0.83·log10 H − 2.46). */
export function cadmiumGuideline(hardness: number): number {
  if (hardness < 17) return 0.04
  if (hardness > 280) return 0.37
  return Math.pow(10, 0.83 * Math.log10(hardness) - 2.46)
}

/** Cobre (µg/L). H<82 -> 2; H>180 -> 4; si no 0.2·e^(0.8545·ln H − 1.465). */
export function copperGuideline(hardness: number): number {
  if (hardness < 82) return 2
  if (hardness > 180) return 4
  return 0.2 * Math.exp(0.8545 * Math.log(hardness) - 1.465)
}

/** Níquel (µg/L). H<=60 -> 25; H>180 -> 150; si no e^(0.76·ln H + 1.06). */
export function nickelGuideline(hardness: number): number {
  if (hardness <= 60) return 25
  if (hardness > 180) return 150
  return Math.exp(0.76 * Math.log(hardness) + 1.06)
}

/** Plomo (µg/L). H<60 -> 1; H>180 -> 7; si no e^(1.273·ln H − 4.705). */
export function leadGuideline(hardness: number): number {
  if (hardness < 60) return 1
  if (hardness > 180) return 7
  return Math.exp(1.273 * Math.log(hardness) - 4.705)
}

/** Zinc (µg/L). H<90 -> 7.5; si no 7.5 + 0.75·(H − 90). */
export function zincGuideline(hardness: number): number {
  if (hardness < 90) return 7.5
  return 7.5 + 0.75 * (hardness - 90)
}

/** Aluminio (mg/L). pH<6.5 -> 0.005; si no 0.1. */
export function aluminumGuideline(pH: number): number {
  return pH < 6.5 ? 0.005 : 0.1
}

/**
 * Guía de amoníaco TOTAL (mg/L N) equivalente al límite del amoníaco no
 * ionizado, dado pH y temperatura. fracción no ionizada:
 * f = 1/(1 + 10^(0.09018 + 2729.92/(273.2+T) − pH)); guía_total = límite/f.
 */
export function ammoniaTotalGuideline(unionizedLimit: number, pH: number, tempC: number): number {
  const f = 1 / (1 + Math.pow(10, 0.09018 + 2729.92 / (273.2 + tempC) - pH))
  return unionizedLimit / f
}
