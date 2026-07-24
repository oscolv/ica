export type Severity = 'error' | 'warn' | 'ok'

export interface ValidationIssue {
  severity: Severity
  code: string
  message: string
  parameterId?: string
  column?: string
  row?: number
}
