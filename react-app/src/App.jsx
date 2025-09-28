import React, { useRef, useState, useEffect } from 'react'
import MetaballIntro from './components/MetaballIntro'
import PortfolioContent from './components/PortfolioContent'
import BackgroundTransition from './components/BackgroundTransition'

export default function App(){
  const [phase, setPhase] = useState('interactive') // 'interactive' | 'transitioning' | 'portfolio'
  const [scrollProgress, setScrollProgress] = useState(0) // Scroll progress (0 to 1)
  const introRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const maxScroll = window.innerHeight // Adjusted to make the main page slide fully
      const progress = Math.min(scrollY / maxScroll, 1) // Clamp between 0 and 1
      setScrollProgress(progress)

      console.log('Scroll Progress:', progress) // Debugging scroll progress

      // Update phase based on scroll progress
      if (progress === 1 && phase !== 'portfolio') {
        setPhase('portfolio')
      } else if (progress > 0 && progress < 1 && phase !== 'transitioning') {
        setPhase('transitioning')
      } else if (progress === 0 && phase !== 'interactive') {
        setPhase('interactive')
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [phase])

  return (
    <div className="app-root">
      <BackgroundTransition phase={phase} />
      <MetaballIntro
        ref={introRef}
        phase={phase}
        scrollProgress={scrollProgress} // Pass scroll progress to MetaballIntro
      />
      <PortfolioContent phase={phase} scrollProgress={scrollProgress} />
    </div>
  )
}
