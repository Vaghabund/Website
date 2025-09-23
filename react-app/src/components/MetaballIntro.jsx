import React, { useEffect, useRef } from 'react'

// Metaball canvas wrapped as a React component
export default function MetaballIntro({ onEnter }){
  const canvasRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width = canvas.width = window.innerWidth
    let height = canvas.height = window.innerHeight

    // Simple set of metaballs for demo (kept small)
    const balls = []
    const centerX = width/2
    const centerY = height/2
    const radius = 50

    for(let i=0;i<4;i++){
      const isCenter = i===0
      const angle = isCenter?0:((i-1)/3)*Math.PI*2
      balls.push({ x: centerX, y: centerY, vx:0, vy:0, baseRadius:radius, radius, color:'rgba(255,255,255,0.9)', isCenter, orbitAngle:angle, orbitRadius:120, age:0 })
    }

    let mouseX = -1000, mouseY = -1000, mouseMoved = false

    function resize(){
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    window.addEventListener('resize', resize)

    function updateBall(ball, dt){
      ball.age += dt
      const cx = width/2, cy = height/2

      if(ball.age <= 4){
        if(ball.isCenter){
          ball.radius = ball.baseRadius + Math.sin(ball.age*2)*5
        } else {
          if(ball.age <= 1){
            const targetX = cx + Math.cos(ball.orbitAngle)*ball.orbitRadius
            const targetY = cy + Math.sin(ball.orbitAngle)*ball.orbitRadius
            ball.x += (targetX - ball.x)*0.05
            ball.y += (targetY - ball.y)*0.05
          } else {
            ball.orbitAngle += 0.02
            ball.x = cx + Math.cos(ball.orbitAngle)*ball.orbitRadius
            ball.y = cy + Math.sin(ball.orbitAngle)*ball.orbitRadius
          }
        }
      } else if(!mouseMoved) {
        if(ball.isCenter){
          ball.radius = ball.baseRadius + Math.sin(ball.age*2)*5
        } else {
          ball.orbitAngle += 0.02
          ball.x = cx + Math.cos(ball.orbitAngle)*ball.orbitRadius
          ball.y = cy + Math.sin(ball.orbitAngle)*ball.orbitRadius
        }
      } else {
        // interactive-ish
        ball.x += ball.vx*0.5
        ball.y += ball.vy*0.5
        ball.vx += (Math.random()-0.5)*0.1
        ball.vy += (Math.random()-0.5)*0.1

        const dx = mouseX - ball.x
        const dy = mouseY - ball.y
        const dist = Math.sqrt(dx*dx+dy*dy)
        if(dist < 250){
          const force = (250-dist)/250
          ball.vx += (dx/dist)*force*0.8
          ball.vy += (dy/dist)*force*0.8
        }
      }

      // always bounce
      if(ball.x <= ball.radius){ ball.x = ball.radius; ball.vx = Math.abs(ball.vx)||0.5 }
      else if(ball.x >= width - ball.radius){ ball.x = width-ball.radius; ball.vx = -Math.abs(ball.vx)||-0.5 }
      if(ball.y <= ball.radius){ ball.y = ball.radius; ball.vy = Math.abs(ball.vy)||0.5 }
      else if(ball.y >= height - ball.radius){ ball.y = height-ball.radius; ball.vy = -Math.abs(ball.vy)||-0.5 }

      // friction
      ball.vx *= 0.98
      ball.vy *= 0.98
    }

    function draw(){
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(0,0,width,height)

      ctx.globalCompositeOperation = 'screen'
      for(const b of balls){
        const g = ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.radius)
        g.addColorStop(0, b.color)
        g.addColorStop(0.7, b.color.replace(/0\.\d+/, '0.3'))
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(b.x,b.y,b.radius,0,Math.PI*2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
    }

    let last = performance.now()
    function loop(t){
      const dt = (t-last)/1000
      last = t
      for(const b of balls) updateBall(b, dt)
      draw()
      animationRef.current = requestAnimationFrame(loop)
    }

    animationRef.current = requestAnimationFrame(loop)

    // mouse listeners
    function onMove(e){ mouseX = e.clientX; mouseY = e.clientY; mouseMoved = true }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('click', () => onEnter())
    canvas.addEventListener('touchmove', (e)=>{ e.preventDefault(); const t = e.touches[0]; mouseX = t.clientX; mouseY = t.clientY; mouseMoved = true }, { passive:false })

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('click', () => onEnter())
    }
  }, [onEnter])

  return (
    <div className="intro-root">
      <canvas ref={canvasRef} className="metaball-canvas" />
      <button className="enter-cta" onClick={onEnter} aria-label="Enter site">↻</button>
    </div>
  )
}
