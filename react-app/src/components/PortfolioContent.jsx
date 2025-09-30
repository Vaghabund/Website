import React, { useState } from 'react'

const ProjectPage = ({ project, onBack }) => {
  return (
    <div className="project-page">
      <button className="back-button" onClick={onBack}>
        ← Back to Projects
      </button>
      
      <div className="project-page-content">
        <header className="project-page-header">
          <h1 className="project-page-title">{project.title}</h1>
          <p className="project-page-subtitle">{project.subtitle}</p>
        </header>

        <div className="project-page-body">
          <div className="project-hero-image">
            <img src={project.heroImage || project.image} alt={project.title} />
          </div>

          <div className="project-details-grid">
            <div className="project-description-section">
              <h3>Overview</h3>
              <p>{project.fullDescription || project.description}</p>
              
              {project.challenge && (
                <>
                  <h3>Challenge</h3>
                  <p>{project.challenge}</p>
                </>
              )}
              
              {project.solution && (
                <>
                  <h3>Solution</h3>
                  <p>{project.solution}</p>
                </>
              )}
            </div>

            <div className="project-info-section">
              <div className="project-info-item">
                <h4>Role</h4>
                <p>{project.role || 'Full Stack Developer'}</p>
              </div>
              
              <div className="project-info-item">
                <h4>Timeline</h4>
                <p>{project.timeline || '3 months'}</p>
              </div>
              
              <div className="project-info-item">
                <h4>Technologies</h4>
                <ul className="tech-list">
                  {(project.technologies || ['React', 'Node.js', 'CSS']).map((tech, index) => (
                    <li key={index}>{tech}</li>
                  ))}
                </ul>
              </div>

              {project.liveUrl && (
                <div className="project-info-item">
                  <h4>Links</h4>
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="project-link">
                    View Live Site →
                  </a>
                </div>
              )}
            </div>
          </div>

          {project.gallery && project.gallery.length > 0 && (
            <div className="project-gallery">
              <h3>Gallery</h3>
              <div className="gallery-grid">
                {project.gallery.map((image, index) => (
                  <img key={index} src={image} alt={`${project.title} ${index + 1}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const projectsData = [
  {
    id: 1,
    title: 'Project Alpha',
    subtitle: 'Web Development',
    year: '2024',
    description: 'A modern web application built with React and Node.js, featuring real-time collaboration and advanced data visualization.',
    fullDescription: 'Project Alpha represents a comprehensive solution for team collaboration in data-intensive environments. Built with modern web technologies, it provides real-time synchronization, advanced analytics, and intuitive user interfaces that make complex data accessible to all team members.',
    image: 'https://picsum.photos/400/250?random=1',
    thumbnailImage: 'https://picsum.photos/60/40?random=11',
    heroImage: 'https://picsum.photos/800/400?random=21',
    challenge: 'The main challenge was creating a system that could handle real-time data updates while maintaining performance and user experience across different devices and network conditions.',
    solution: 'We implemented a WebSocket-based architecture with optimistic updates and conflict resolution, paired with a responsive design system that adapts to various screen sizes and interaction methods.',
    role: 'Lead Developer & UI Designer',
    timeline: '4 months',
    technologies: ['React', 'Node.js', 'WebSocket', 'MongoDB', 'D3.js'],
    liveUrl: 'https://example.com',
    gallery: [
      'https://picsum.photos/600/400?random=31',
      'https://picsum.photos/600/400?random=32'
    ]
  },
  {
    id: 2,
    title: 'Project Beta',
    subtitle: 'UI/UX Design',
    year: '2024',
    description: 'Complete redesign of a mobile banking application, focusing on accessibility and user experience improvements.',
    fullDescription: 'A comprehensive redesign of a banking application that serves over 50,000 users daily. The project focused on improving accessibility, streamlining user flows, and creating a more intuitive financial management experience.',
    image: 'https://picsum.photos/400/250?random=2',
    thumbnailImage: 'https://picsum.photos/60/40?random=12',
    heroImage: 'https://picsum.photos/800/400?random=22',
    challenge: 'The existing app had poor accessibility scores and complex navigation that confused users, particularly older demographics.',
    solution: 'Implemented a new design system with clear visual hierarchy, improved color contrast, and simplified user flows based on extensive user testing.',
    role: 'UX Designer & Researcher',
    timeline: '6 months',
    technologies: ['Figma', 'React Native', 'Accessibility Testing', 'User Research'],
    gallery: [
      'https://picsum.photos/600/400?random=33',
      'https://picsum.photos/600/400?random=34'
    ]
  },
  {
    id: 3,
    title: 'Project Gamma',
    subtitle: 'Mobile App',
    year: '2023',
    description: 'Cross-platform mobile application for fitness tracking with AI-powered workout recommendations.',
    fullDescription: 'An innovative fitness application that uses machine learning to provide personalized workout recommendations based on user behavior, fitness level, and goals.',
    image: 'https://picsum.photos/400/250?random=3',
    thumbnailImage: 'https://picsum.photos/60/40?random=13',
    heroImage: 'https://picsum.photos/800/400?random=23',
    challenge: 'Creating an AI system that could provide accurate, personalized fitness recommendations while maintaining user privacy and data security.',
    solution: 'Developed a federated learning system that processes user data locally while contributing to model improvements without compromising personal information.',
    role: 'Mobile Developer & ML Engineer',
    timeline: '8 months',
    technologies: ['React Native', 'TensorFlow', 'Python', 'Firebase', 'HealthKit'],
    gallery: [
      'https://picsum.photos/600/400?random=35',
      'https://picsum.photos/600/400?random=36'
    ]
  },
  {
    id: 4,
    title: 'Project Delta',
    subtitle: 'Brand Identity',
    year: '2023',
    description: 'Complete brand identity design for a sustainable fashion startup, including logo, packaging, and digital presence.',
    fullDescription: 'A comprehensive brand identity project for EcoThreads, a sustainable fashion startup committed to ethical manufacturing and environmental responsibility.',
    image: 'https://picsum.photos/400/250?random=4',
    thumbnailImage: 'https://picsum.photos/60/40?random=14',
    heroImage: 'https://picsum.photos/800/400?random=24',
    challenge: 'Creating a brand identity that communicates both premium quality and environmental consciousness in a crowded fashion market.',
    solution: 'Developed a minimalist design language with earth-tones and sustainable materials, paired with clear messaging about the brand\'s environmental impact.',
    role: 'Brand Designer & Art Director',
    timeline: '3 months',
    technologies: ['Adobe Creative Suite', 'Figma', 'Print Design', 'Web Design'],
    gallery: [
      'https://picsum.photos/600/400?random=37',
      'https://picsum.photos/600/400?random=38'
    ]
  }
]

export default function PortfolioContent({ selectedProject, onProjectClick, onBackToProjects }){
  const [expandedProject, setExpandedProject] = useState(null)

  const toggleProject = (projectId) => {
    setExpandedProject(expandedProject === projectId ? null : projectId)
  }

  // If a project is selected, show project page
  if (selectedProject) {
    return (
      <div className="portfolio-content-main">
        <ProjectPage 
          project={selectedProject} 
          onBack={onBackToProjects}
        />
      </div>
    )
  }

  return (
    <div className="portfolio-content-main">
      <div className="projects-container">
        <div className="header-section">
          <p className="subtitle">Creative Developer & Designer</p>
        </div>

        <div className="flavor-text-section">
          <p className="flavor-text">
            I create digital experiences that blend technology with artistry. 
            Each project is a journey through code, design, and human connection.
          </p>
        </div>
        
        <div className="projects-section">
          <div className="projects-separator"></div>
          <ul className="project-list">
            {projectsData.map((project, index) => (
              <li key={project.id} className="project-item">
                <div 
                  className="project-header"
                  onClick={() => toggleProject(project.id)}
                >
                  <span className="project-index">{String(index + 1).padStart(2, '0')}</span>
                  <div className="project-info">
                    <h3 className="project-title">{project.title}</h3>
                    <span className="project-separator">—</span>
                    <span className="project-subtitle">{project.subtitle}</span>
                  </div>
                  <span className="project-year">{project.year}</span>
                  <div className="project-thumbnail">
                    <img src={project.thumbnailImage || project.image} alt={project.title} />
                  </div>
                  <span className="expand-icon">
                    {expandedProject === project.id ? '−' : '+'}
                  </span>
                </div>
                
                <div className={`project-details ${expandedProject === project.id ? 'expanded' : ''}`}>
                  <div className="project-content">
                    <div className="project-description">
                      <p>{project.description}</p>
                      <button 
                        className="see-project-link"
                        onClick={() => onProjectClick(project)}
                      >
                        See project →
                      </button>
                    </div>
                    <div className="project-image">
                      <img src={project.image} alt={project.title} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
