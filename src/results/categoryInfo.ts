export function categoryLabelEs(category: string): string {
  switch (category) {
    case 'Excellent': return 'Excelente'
    case 'Good': return 'Buena'
    case 'Fair': return 'Regular'
    case 'Marginal': return 'Marginal'
    default: return 'Mala' // Poor
  }
}

export function categoryClass(category: string): string {
  switch (category) {
    case 'Excellent': return 'cat-excelente'
    case 'Good': return 'cat-buena'
    case 'Fair': return 'cat-regular'
    case 'Marginal': return 'cat-marginal'
    default: return 'cat-mala' // Poor
  }
}
