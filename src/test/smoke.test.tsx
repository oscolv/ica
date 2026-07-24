import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

function Hola() {
  return <p>hola ICA</p>
}

describe('setup de componentes', () => {
  it('renderiza un componente en jsdom', () => {
    render(<Hola />)
    expect(screen.getByText('hola ICA')).toBeInTheDocument()
  })
})
