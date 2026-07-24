export type RuleType =
  | 'max'
  | 'min'
  | 'range'
  | 'hardnessStep'
  | 'season'
  | 'ammonia'
  | 'alPh'
  | 'cdHardness'
  | 'cuHardness'
  | 'niHardness'
  | 'pbHardness'
  | 'znHardness'

export type EvalMode = 'max' | 'min' | 'range'

export interface GuidelineRow {
  parameterId: string
  ruleType: RuleType
  lowerLimit: number | null
  upperLimit: number | null
  hardnessLower?: number | null
  hardnessUpper?: number | null
  seasonStart?: string | null
  seasonFinish?: string | null
  unit?: string
  source?: string
}

/** paramId -> filas (season y hardnessStep usan varias filas). */
export type GuidelineTable = Map<string, GuidelineRow[]>

export interface SampleContext {
  hardness: number | null
  pH: number | null
  temp: number | null
  date: Date | null
}

export interface ResolvedGuideline {
  /** número para max/min; tupla [inf, sup] para range. */
  target: number | [number | null, number | null]
  mode: EvalMode
}

export interface DataRow {
  station: string
  date: Date | null
  /** valores crudos por columna de parámetro (aún sin parsear). */
  values: Record<string, string>
}

export interface StationResult {
  station: string
  nParams: number
  nTests: number
  failedParams: string[]
  nFailedTests: number
  f1: number
  f2: number
  f3: number
  nse: number
  wqi: number
  category: string
}

export interface ComputeOptions {
  hardnessCol?: string
  phCol?: string
  tempCol?: string
}
