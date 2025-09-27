import React, { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function BackgroundTransition({ phase }){
  const el = useRef(null)

  useEffect(() => {
    if(!el.current) return
    if(phase === 'transitioning'){
      gsap.to(el.current, { backgroundColor: '#ffffff', duration: 0.8, delay: 0.2, ease: 'none' })
    } else if(phase === 'interactive'){
      gsap.set(el.current, { backgroundColor: '#000000' })
    } else if(phase === 'portfolio'){
      gsap.set(el.current, { backgroundColor: '#ffffff' })
    }
  }, [phase])

  return (
    <div ref={el} className="bg-transition" />
  )
}
