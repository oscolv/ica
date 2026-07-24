export function categoryLabelEs(category: string): string {
  switch (category) {
    case 'Excellent': return 'Excelente'
    case 'Good': return 'Buena'
    case 'Fair': return 'Regular'
    case 'Marginal': return 'Marginal'
    default: return 'Mala' // Poor
  }
}

export function categoryColor(category: string): string {
  switch (category) {
    case 'Excellent': return '#1E8449'
    case 'Good': return '#27AE60'
    case 'Fair': return '#F1C40F'
    case 'Marginal': return '#E67E22'
    default: return '#C0392B' // Poor
  }
}
