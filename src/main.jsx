import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PwaControls from './components/PwaControls.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <PwaControls />
  </StrictMode>,
)
