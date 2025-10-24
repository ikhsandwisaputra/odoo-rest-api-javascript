import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Tes from './components/Tes.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
{/* <Tes></Tes> */}
  </StrictMode>,
)
