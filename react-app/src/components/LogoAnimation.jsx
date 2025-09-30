import React, { useEffect, useRef } from 'react'

const LogoAnimation = ({ onClick }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const ballsRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const size = 40 // Even smaller for header
    canvas.width = size
    canvas.height = size

    const balls = []
    const centerX = size / 2
    const centerY = size / 2
    const radius = 6 // Even smaller radius for header

    // Create 4 balls in orbital formation
    for(let i = 0; i < 4; i++){
      const isCenter = i === 0
      const angle = isCenter ? 0 : ((i - 1) / 3) * Math.PI * 2
      balls.push({ 
        x: centerX, 
        y: centerY, 
        baseRadius: radius, 
        radius, 
        isCenter, 
        orbitAngle: angle, 
        orbitRadius: 12, // Even smaller orbit for header
        age: 0 
      })
    }
    ballsRef.current = balls

    function updateBall(ball, dt){
      ball.age += dt

      // Center ball subtle pulsing
      if(ball.isCenter){
        ball.radius = ball.baseRadius + Math.sin(ball.age * 2) * 1
      } else {
        // Continuous orbital motion
        ball.orbitAngle += 0.02
        ball.x = centerX + Math.cos(ball.orbitAngle) * ball.orbitRadius
        ball.y = centerY + Math.sin(ball.orbitAngle) * ball.orbitRadius
      }
    }

    function draw(){
      // Clear with white background
      ctx.fillStyle = 'rgba(255, 255, 255, 1)'
      ctx.fillRect(0, 0, size, size)

      // Draw balls with dark style
      ctx.globalCompositeOperation = 'source-over'
      for(const b of ballsRef.current){
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius)
        g.addColorStop(0, 'rgba(0, 0, 0, 0.95)')
        g.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)')
        g.addColorStop(1, 'rgba(0, 0, 0, 0)')
        
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    let last = performance.now()
    function loop(t){
      const dt = (t - last) / 1000
      last = t

      for(const b of ballsRef.current) updateBall(b, dt)
      draw()
      animationRef.current = requestAnimationFrame(loop)
    }

    animationRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [])

  return (
    <div className="logo-container" onClick={onClick}>
      <canvas ref={canvasRef} className="logo-canvas" />
    </div>
  )
}

export default LogoAnimation