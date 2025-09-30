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
    const radius = 4 // Smaller radius for header

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
        orbitRadius: 14, // Optimal spacing for header
        age: 0 
      })
    }
    ballsRef.current = balls

    function updateBall(ball, dt){
      ball.age += dt

      // Center ball subtle pulsing
      if(ball.isCenter){
        ball.radius = ball.baseRadius + Math.sin(ball.age * 1.5) * 1
      } else {
        // Slower orbital motion
        ball.orbitAngle += 0.008
        ball.x = centerX + Math.cos(ball.orbitAngle) * ball.orbitRadius
        ball.y = centerY + Math.sin(ball.orbitAngle) * ball.orbitRadius
      }
    }

    function draw(){
      // Clear with white background
      ctx.fillStyle = 'rgba(255, 255, 255, 1)'
      ctx.fillRect(0, 0, size, size)

      // Draw balls with same style as main animation - solid black with blur
      ctx.globalCompositeOperation = 'source-over'
      for(const b of ballsRef.current){
        // Add blur effect (scaled down for smaller logo)
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 8
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        
        // Solid black fill
        ctx.fillStyle = 'rgba(0,0,0,1)'
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
        ctx.fill()
        
        // Reset shadow for next iteration
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
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