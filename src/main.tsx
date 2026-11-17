import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import Lenis from 'lenis'
import './index.css'
import { TRPCProvider } from "@/providers/trpc"
import App from './App.tsx'

// Lenis smooth scroll site-wide (lerp 0.1). Disabled under prefers-reduced-motion.
if (typeof window !== 'undefined') {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!reduced) {
    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1.0 })
    const raf = (time: number) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis
  }
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <TRPCProvider>
      <App />
    </TRPCProvider>
  </BrowserRouter>,
)
