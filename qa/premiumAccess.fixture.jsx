// Only loaded by the QA harness, never by src/main.jsx or the production bundle.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../src/App.jsx'
import { createPlanAccess } from '../src/services/planAccess.js'
import '../src/index.css'

const access = createPlanAccess(() => 'premium')
createRoot(document.getElementById('root')).render(<StrictMode><App access={access} /></StrictMode>)
