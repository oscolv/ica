import type { StationResult } from '../engine/types'

const HEADER =
  'Station,WQI,Categoria,F1,F2,F3,nse,ParametrosTotales,PruebasTotales,PruebasFallidas,ParametrosQueFallan'

function rowToCsv(r: StationResult): string {
  return [
    `"${r.station}"`,
    r.wqi.toFixed(1),
    r.category,
    r.f1.toFixed(1),
    r.f2.toFixed(1),
    r.f3.toFixed(2),
    r.nse.toFixed(4),
    r.nParams,
    r.nTests,
    r.nFailedTests,
    `"${r.failedParams.join('; ')}"`,
  ].join(',')
}

export function resultsToCsv(results: StationResult[]): string {
  return [HEADER, ...results.map(rowToCsv)].join('\n') + '\n'
}
