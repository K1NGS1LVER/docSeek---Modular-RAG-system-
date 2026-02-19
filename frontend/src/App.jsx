import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AppPage from './pages/AppPage'
import './App.css'

export default function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('ds_theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ds_theme', theme)
  }, [theme])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage theme={theme} setTheme={setTheme} />} />
        <Route path="/app" element={<AppPage theme={theme} setTheme={setTheme} />} />
      </Routes>
    </BrowserRouter>
  )
}

