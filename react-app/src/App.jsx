import React, { useRef, useState } from 'react'
import MetaballIntro from './components/MetaballIntro'
import PortfolioContent from './components/PortfolioContent'
import BackgroundTransition from './components/BackgroundTransition'

export default function App(){
  const [phase, setPhase] = useState('interactive') // 'interactive' | 'transitioning' | 'portfolio'
  const introRef = useRef(null)

  function handleStartTransition(){
    if(phase !== 'interactive') return
    setPhase('transitioning')
    if(introRef.current && introRef.current.startTransition) introRef.current.startTransition(() => setPhase('portfolio'))
  }

  return (
    <div className="app-root">
      <BackgroundTransition phase={phase} />
      <MetaballIntro ref={introRef} phase={phase} onMobileEnter={handleStartTransition} onDoubleClick={handleStartTransition} />
      <PortfolioContent phase={phase} />
    </div>
  )
}
