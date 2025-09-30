import React, { useEffect, useRef } from 'react'

// Interactive metaball canvas component
const MetaballIntro = ({ isEmbedded = false }) => {
  const canvasRef = useRef(null)
  const cursorCanvasRef = useRef(null)
  const animationRef = useRef(null)
  const ballsRef = useRef([])
  const groupTransform = useRef({ x:0, y:0, scale:1 })

  useEffect(() => {
  const canvas = canvasRef.current
  const ctx = canvas.getContext('2d')
  const cursorCanvas = cursorCanvasRef.current
  const cctx = cursorCanvas.getContext('2d')
    // Always use full screen dimensions for popup
    let width = canvas.width = window.innerWidth
    let height = canvas.height = window.innerHeight
  cursorCanvas.width = width
  cursorCanvas.height = height

    const balls = []
    const centerX = () => width/2
    const centerY = () => height/2
    const radius = 50

    for(let i=0;i<4;i++){
      const isCenter = i===0
      const angle = isCenter?0:((i-1)/3)*Math.PI*2
      balls.push({ x: centerX(), y: centerY(), vx:0, vy:0, baseRadius:radius, radius, color:'rgba(255,255,255,0.95)', isCenter, orbitAngle:angle, orbitRadius:120, age:0 })
    }
    ballsRef.current = balls

  let mouseX = -1000, mouseY = -1000, mouseMoved = false
    let allowMouse = true

    function resize(){
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      if(cursorCanvas){ cursorCanvas.width = width; cursorCanvas.height = height }
    }

    window.addEventListener('resize', resize)

    function updateBall(ball, dt){
      ball.age += dt
      const cx = centerX(), cy = centerY()

      // center ball subtle pulsing
      if(ball.isCenter){
        ball.radius = ball.baseRadius + Math.sin(ball.age*2)*5
      }

      // initial formation / orbital behaviour for the first 2 seconds
      if(ball.age <= 2){
        if(ball.isCenter){
          // center just pulses
        } else {
          if(ball.age <= 1){
            // ease into orbit positions
            const targetX = cx + Math.cos(ball.orbitAngle)*ball.orbitRadius
            const targetY = cy + Math.sin(ball.orbitAngle)*ball.orbitRadius
            ball.x += (targetX - ball.x)*0.05
            ball.y += (targetY - ball.y)*0.05
          } else {
            // follow orbital motion
            ball.orbitAngle += 0.02
            ball.x = cx + Math.cos(ball.orbitAngle)*ball.orbitRadius
            ball.y = cy + Math.sin(ball.orbitAngle)*ball.orbitRadius
          }
        }
      } else if(!mouseMoved) {
        // if no mouse movement after startup OR app is not in interactive phase, keep orbiting
        if(ball.isCenter){
          // pulse
        } else {
          ball.orbitAngle += 0.02
          ball.x = cx + Math.cos(ball.orbitAngle)*ball.orbitRadius
          ball.y = cy + Math.sin(ball.orbitAngle)*ball.orbitRadius
        }
      } else {
        // interactive physics (flowing behind cursor)
        // apply velocity integration and some random jitter
        ball.x += ball.vx * 0.5
        ball.y += ball.vy * 0.5
        ball.vx += (Math.random()-0.5)*0.1
        ball.vy += (Math.random()-0.5)*0.1

        const dx = mouseX - ball.x
        const dy = mouseY - ball.y
        const dist = Math.sqrt(dx*dx+dy*dy) || 1
        if(dist < 250){
          const force = (250-dist)/250
          ball.vx += (dx/dist)*force*0.8
          ball.vy += (dy/dist)*force*0.8
        }
      }

      // bounce against edges
      if(ball.x <= ball.radius){ ball.x = ball.radius; ball.vx = Math.abs(ball.vx)||0.5 }
      else if(ball.x >= width - ball.radius){ ball.x = width-ball.radius; ball.vx = -Math.abs(ball.vx)||-0.5 }
      if(ball.y <= ball.radius){ ball.y = ball.radius; ball.vy = Math.abs(ball.vy)||0.5 }
      else if(ball.y >= height - ball.radius){ ball.y = height-ball.radius; ball.vy = -Math.abs(ball.vy)||-0.5 }

      // friction
      ball.vx *= 0.98
      ball.vy *= 0.98
    }

    function draw(){
  // Clear canvas completely to make background transparent for glassmorphism effect
  ctx.clearRect(0,0,width,height)

      // Apply group transform by translating context
      ctx.save()
      const gx = groupTransform.current.x
      const gy = groupTransform.current.y
      const gs = groupTransform.current.scale
      ctx.translate(gx, gy)
      ctx.scale(gs, gs)

  // Solid black metaballs with edge blur
  ctx.globalCompositeOperation = 'source-over'
      for(const b of ballsRef.current){
        // Add maximum blur effect for very soft edges
        ctx.shadowColor = 'rgba(0,0,0,0.9)'
        ctx.shadowBlur = 40
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        
        // Solid black fill
        ctx.fillStyle = 'rgba(0,0,0,1)'
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2)
        ctx.fill()
        
        // Reset shadow for next iteration
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
      }

      // cursor trail is drawn after restoring transform so it stays in screen space

      ctx.globalCompositeOperation = 'source-over'
      ctx.restore()

      // cursor drawn separately on cursor canvas (so metaball canvas can have partial clear trailing)
      // main canvas does not draw the cursor here
      
      // always clear cursor overlay first to avoid stuck drawings
      cctx.clearRect(0,0,width,height)
      // draw cursor overlay if we have seen movement
      if(mouseMoved){
        cctx.save()
        // Use source-over for better visibility on glassmorphism background
        cctx.globalCompositeOperation = 'source-over'
        const g = cctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 10)
        // Dark cursor for visibility
        g.addColorStop(0, 'rgba(0,0,0,0.5)')
        g.addColorStop(0.7, 'rgba(0,0,0,0.3)')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        cctx.fillStyle = g
        cctx.beginPath()
        cctx.arc(mouseX, mouseY, 10, 0, Math.PI*2)
        cctx.fill()
        cctx.restore()
      }
    }


    let last = performance.now()
    function loop(t){
      const dt = (t-last)/1000
      last = t

      for(const b of ballsRef.current) updateBall(b, dt)
      draw()
      animationRef.current = requestAnimationFrame(loop)
    }

    animationRef.current = requestAnimationFrame(loop)

  function onMove(e){ if(!allowMouse) return; mouseX = e.clientX; mouseY = e.clientY; mouseMoved = true }
  function onPointerDown(e){/* placeholder */}
  function onDblClick(e){ /* placeholder */ }
  function onClick(e){ /* single click intentionally disabled for transition */ }

  // Simplified keyboard handler (no callbacks needed)
  function onKeyDown(e){
    // Keyboard interaction can be added here if needed
  }

  canvas.addEventListener('mousemove', onMove)
  // also listen globally so elements like buttons don't prevent pointer tracking
  window.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('dblclick', onDblClick)
  // do NOT start transition on single click of canvas
  // global keyboard listener
  window.addEventListener('keydown', onKeyDown)
  canvas.addEventListener('touchmove', (e)=>{ if(!allowMouse) return; const t = e.touches[0]; mouseX = t.clientX; mouseY = t.clientY; mouseMoved = true }, { passive:false })
  window.addEventListener('touchmove', (e)=>{ if(!allowMouse) return; const t = e.touches[0]; mouseX = t.clientX; mouseY = t.clientY; mouseMoved = true }, { passive:false })

    // cleanup
    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMove)
      window.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('dblclick', onDblClick)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchmove', (e)=>{ if(!allowMouse) return; const t = e.touches[0]; mouseX = t.clientX; mouseY = t.clientY; mouseMoved = true })
    }
  }, [])

  // Component is now purely interactive - no automatic transitions

  // Render
  return (
    <div className="intro-root">
      <canvas ref={canvasRef} className="metaball-canvas" />
      <canvas ref={cursorCanvasRef} className="cursor-canvas" />
    </div>
  )
}

export default MetaballIntro
