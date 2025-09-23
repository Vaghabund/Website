import React, { useState } from 'react'
import MetaballIntro from './components/MetaballIntro'

export default function App(){
  const [entered, setEntered] = useState(false)

  return (
    <div className="app-root">
      {!entered ? (
        <MetaballIntro onEnter={() => setEntered(true)} />
      ) : (
        <main className="projects">
          <h1>Your Projects</h1>
          <p>This is a placeholder project overview. Replace this with your project cards.</p>
          <div className="project-grid">
            <div className="card">Project 1</div>
            <div className="card">Project 2</div>
            <div className="card">Project 3</div>
          </div>
        </main>
      )}
    </div>
  )
}
