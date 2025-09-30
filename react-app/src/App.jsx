import React, { useRef, useState } from 'react'
import MetaballIntro from './components/MetaballIntro'
import PortfolioContent from './components/PortfolioContent'
import LogoAnimation from './components/LogoAnimation'
import Header from './components/Header'

export default function App(){
  const [showAnimationPopup, setShowAnimationPopup] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const introRef = useRef(null)

  const handleLogoClick = () => {
    setShowAnimationPopup(true)
  }

  const handleAnimationComplete = () => {
    setShowAnimationPopup(false)
  }

  const handleClosePopup = () => {
    setShowAnimationPopup(false)
  }

  const handleNameClick = () => {
    setSelectedProject(null)
  }

  const handleProjectClick = (project) => {
    setSelectedProject(project)
  }

  const handleBackToProjects = () => {
    setSelectedProject(null)
  }

  return (
    <div className="app-root main-mode">
      <Header 
        onLogoClick={handleLogoClick}
        onNameClick={handleNameClick}
      />
      <PortfolioContent 
        selectedProject={selectedProject}
        onProjectClick={handleProjectClick}
        onBackToProjects={handleBackToProjects}
      />
      
      {showAnimationPopup && (
        <div className="animation-fullscreen-overlay">
          <button className="close-button-topleft" onClick={handleClosePopup}>
            ×
          </button>
          <MetaballIntro
            ref={introRef}
            isEmbedded={false}
          />
        </div>
      )}
    </div>
  )
}
