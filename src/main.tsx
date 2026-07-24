import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/base.css'
import App from './App.tsx'
import { ProjectProvider } from './state/ProjectContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProjectProvider>
      <App />
    </ProjectProvider>
  </StrictMode>,
)
