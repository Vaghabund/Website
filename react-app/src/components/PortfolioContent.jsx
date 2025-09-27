import React from 'react'

export default function PortfolioContent({ phase }){
  // phase: 'interactive' | 'transitioning' | 'portfolio'
  const visible = phase === 'portfolio' || phase === 'transitioning'
  return (
    <div className={`portfolio-content ${visible? 'visible':''}`} aria-hidden={phase!=='portfolio'}>
      <main className="projects">
        <h1>Your Projects</h1>
        <p>This is a placeholder project overview. Replace this with your project cards.</p>
        <div className="project-grid">
          <div className="card">Project 1</div>
          <div className="card">Project 2</div>
          <div className="card">Project 3</div>
        </div>
      </main>
    </div>
  )
}
