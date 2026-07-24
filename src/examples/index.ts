import guidelinesCsv from './manual-guidelines.csv?raw'
import dataCsv from './manual-data.csv?raw'
import type { GuidelineTable, DataRow } from '../engine/types'
import { parseGuidelinesCsv } from '../io/parseGuidelines'
import { parseDataCsv } from '../io/parseData'

export interface ExampleProject {
  guidelineTable: GuidelineTable
  guidelineName: string
  rows: DataRow[]
  columns: string[]
  dataName: string
}

export function loadExample(): ExampleProject {
  const { table } = parseGuidelinesCsv(guidelinesCsv)
  const { rows, columns } = parseDataCsv(dataCsv)
  return {
    guidelineTable: table,
    guidelineName: 'Ejemplo del manual (Tabla 1)',
    rows,
    columns,
    dataName: 'Río North Saskatchewan, Devon 1997',
  }
}
