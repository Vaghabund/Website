import React from 'react'

const SAMPLE_PROJECTS = Array.from({length:12}).map((_,i)=>({
  id: i+1,
  code: String(i+1).padStart(2,'0'),
  title: `Project ${String(i+1).padStart(2,'0')}`,
  category: 'Sculpture',
  year: 2025,
  href: '#'
}))

export default function PortfolioContent({ phase }){
  // phase: 'interactive' | 'transitioning' | 'portfolio'
  const visible = phase === 'portfolio' || phase === 'transitioning'
  return (
    <div className={`portfolio-content ${visible? 'visible':''}`} aria-hidden={phase!=='portfolio'}>
      <main className="projects home-list-root">
        <h1 className="home-heading">WORKS</h1>
        <ol className="home-list">
          {SAMPLE_PROJECTS.map(p => (
            <li key={p.id} className="home-item">
              <div className="index">[{p.code}]</div>
              <div className="meta">
                <a className="project-title" href={p.href} onClick={(e)=>e.preventDefault()}>{p.title}</a>
                <div className="project-sub">{p.category} <span className="year">{p.year}</span></div>
              </div>
              <a className="view-link" href={p.href} onClick={(e)=>e.preventDefault()}>View Project</a>
            </li>
          ))}
        </ol>
      </main>
    </div>
  )
}
