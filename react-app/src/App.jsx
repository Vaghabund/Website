import React, { useState } from 'react'
import MetaballIntro from './components/MetaballIntro'
import PortfolioContent from './components/PortfolioContent'
import Header from './components/Header'

export default function App(){
  const [showAnimationPopup, setShowAnimationPopup] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)

  const handleLogoClick = () => {
    setShowAnimationPopup(true)
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
    <>
      <div className={`app-root main-mode ${showAnimationPopup ? 'blur-background' : ''}`}>
        <Header 
          onLogoClick={handleLogoClick}
          onNameClick={handleNameClick}
        />
        <PortfolioContent 
          selectedProject={selectedProject}
          onProjectClick={handleProjectClick}
          onBackToProjects={handleBackToProjects}
        />
      </div>
      
      {showAnimationPopup && (
        <div className="animation-fullscreen-overlay">
          <button className="close-button-topleft" onClick={handleClosePopup}>
            ×
          </button>
          <MetaballIntro isEmbedded={false} />
        </div>
      )}
    </>
  )
}
