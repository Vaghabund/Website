import React, { useEffect, useRef } from 'react'
import LogoAnimation from './LogoAnimation'

const Header = ({ onLogoClick, onNameClick }) => {
  const nameRef = useRef(null)
  const headerContentRef = useRef(null)

  useEffect(() => {
    let isCalculating = false
    
    const updateNameStretch = () => {
      if (!nameRef.current || !headerContentRef.current || isCalculating) return
      
      isCalculating = true
      
      // Use requestAnimationFrame to ensure DOM is stable
      requestAnimationFrame(() => {
        const headerContent = headerContentRef.current
        const nameElement = nameRef.current
        
        if (!headerContent || !nameElement) {
          isCalculating = false
          return
        }
        
        // Get the available width (header content width minus logo width and gap)
        const headerWidth = headerContent.offsetWidth
        const logoContainer = headerContent.querySelector('.header-right')
        const logoWidth = logoContainer ? logoContainer.offsetWidth : 60
        const gap = 20 // gap between name and logo
        const availableWidth = headerWidth - logoWidth - gap
        
        // Get the natural width of the text
        nameElement.style.transform = 'scaleX(1)'
        const naturalWidth = nameElement.offsetWidth
        
        // Calculate the scale factor to fill available space
        const scaleX = availableWidth / naturalWidth
        
        // Apply the transform
        nameElement.style.transform = `scaleX(${scaleX})`
        
        isCalculating = false
      })
    }

    // Initial calculation with delay to ensure DOM is ready
    setTimeout(updateNameStretch, 100)
    
    // Debounced resize handler to prevent excessive calculations
    let resizeTimeout
    const debouncedResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(updateNameStretch, 150)
    }
    
    // Only update on actual window resize, not DOM mutations
    window.addEventListener('resize', debouncedResize)
    
    return () => {
      window.removeEventListener('resize', debouncedResize)
      clearTimeout(resizeTimeout)
    }
  }, [])

  return (
    <>
      <header className="main-header">
        <div className="header-content" ref={headerContentRef}>
          <div className="header-left">
            <h1 className="header-name" ref={nameRef} onClick={onNameClick}>Joel Tenenberg</h1>
          </div>
          <div className="header-right">
            <LogoAnimation onClick={onLogoClick} />
          </div>
        </div>
      </header>
      <div className="header-separator"></div>
    </>
  )
}

export default Header