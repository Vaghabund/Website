import React from 'react'
import LogoAnimation from './LogoAnimation'

const Header = ({ onLogoClick, onNameClick }) => {
  return (
    <>
      <header className="main-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="header-name" onClick={onNameClick}>Joel Tenenberg</h1>
          </div>
          <div className="header-center">
            <LogoAnimation onClick={onLogoClick} />
          </div>
        </div>
      </header>
      <div className="header-separator"></div>
    </>
  )
}

export default Header