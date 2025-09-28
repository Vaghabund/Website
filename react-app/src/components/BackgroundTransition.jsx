import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function BackgroundTransition({ phase }){
  const el = useRef(null)

  useEffect(() => {
    if(!el.current) return
    if(phase === 'transitioning'){
      gsap.to(el.current, { backgroundColor: '#ffffff', duration: 0.8, ease: 'none' })
    } else if(phase === 'interactive'){
      gsap.set(el.current, { backgroundColor: '#ffffff' }) // Ensure consistent white background
    } else if(phase === 'portfolio'){
      gsap.set(el.current, { backgroundColor: '#ffffff' })
    }
  }, [phase])

  return (
    <div ref={el} className="bg-transition" />
  )
}
