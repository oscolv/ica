import { useMemo } from 'react'
import { useProject } from '../../state/ProjectContext'
import { validateGuidelines } from '../../validation/validateGuidelines'
import './ValidationPanel.css'

export function ValidationPanel() {
  const { state } = useProject()
  const issues = useMemo(
    () => (state.guideline ? validateGuidelines(state.guideline) : []),
    [state.guideline],
  )

  if (!state.guideline) return null

  const errors = issues.filter((i) => i.severity === 'error')
  const warns = issues.filter((i) => i.severity === 'warn')

  if (issues.length === 0) {
    return <div className="vp vp-banner vp-ok">✓ La guía es válida.</div>
  }

  return (
    <div className="vp">
      {errors.length > 0 && (
        <ul className="vp-list vp-errors">
          {errors.map((i, k) => <li key={`e${k}`}>✕ {i.message}</li>)}
        </ul>
      )}
      {warns.length > 0 && (
        <ul className="vp-list vp-warns">
          {warns.map((i, k) => <li key={`w${k}`}>⚠ {i.message}</li>)}
        </ul>
      )}
    </div>
  )
}
