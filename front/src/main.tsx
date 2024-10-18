import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import Navbar from './pages/Navbar.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>

    <App>
      <Navbar />
    </App> 
  </StrictMode>,
)
