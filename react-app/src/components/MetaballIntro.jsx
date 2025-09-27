import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { gsap } from 'gsap'

// Metaball canvas wrapped as a React component with GSAP timeline control
const MetaballIntro = forwardRef(function MetaballIntro({ phase, onMobileEnter, onDoubleClick }, ref){
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const ballsRef = useRef([])
  const timelineRef = useRef(null)
  const groupTransform = useRef({ x:0, y:0, scale:1 })

  useImperativeHandle(ref, () => ({
    startTransition(cb){
      startFullTransition(cb)
    }
  }))

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let width = canvas.width = window.innerWidth
    let height = canvas.height = window.innerHeight

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
    }

    window.addEventListener('resize', resize)

    function updateBall(ball, dt){
      ball.age += dt
      const cx = centerX(), cy = centerY()

      // center ball subtle pulsing
      if(ball.isCenter){
        ball.radius = ball.baseRadius + Math.sin(ball.age*2)*5
      }

      // initial formation / orbital behaviour for the first few seconds
      if(ball.age <= 4){
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
        // if no mouse movement after startup, keep orbiting
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
  // clear previous frame (no motion trail)
  ctx.clearRect(0,0,width,height)

      // Apply group transform by translating context
      ctx.save()
      const gx = groupTransform.current.x
      const gy = groupTransform.current.y
      const gs = groupTransform.current.scale
      ctx.translate(gx, gy)
      ctx.scale(gs, gs)

      ctx.globalCompositeOperation = 'screen'
      for(const b of ballsRef.current){
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius)
        g.addColorStop(0, b.color)
        // try to preserve varying alpha similar to original
        g.addColorStop(0.7, b.color.replace(/0\.(\d+)/, function(m,p){ return '0.3' }))
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2)
        ctx.fill()
      }

      // cursor trail is drawn after restoring transform so it stays in screen space

      ctx.globalCompositeOperation = 'source-over'
      ctx.restore()

      // cursor (single dot) is drawn after restoring transform so it stays in screen space

      if(mouseMoved){
        ctx.save()
        ctx.globalCompositeOperation = 'screen'
        const g = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 10)
        g.addColorStop(0, 'rgba(255,255,255,0.9)')
        g.addColorStop(0.7, 'rgba(255,255,255,0.3)')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(mouseX, mouseY, 10, 0, Math.PI*2)
        ctx.fill()
        ctx.restore()
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
  function onDblClick(e){ if(timelineRef.current) return; if(onDoubleClick) onDoubleClick() }
  function onClick(e){ if(onMobileEnter) onMobileEnter() }

  canvas.addEventListener('mousemove', onMove)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('dblclick', onDblClick)
  canvas.addEventListener('click', onClick)
  canvas.addEventListener('touchmove', (e)=>{ if(!allowMouse) return; const t = e.touches[0]; mouseX = t.clientX; mouseY = t.clientY; mouseMoved = true }, { passive:false })

    // cleanup
    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('dblclick', onDblClick)
      canvas.removeEventListener('click', onClick)
    }
  }, [onDoubleClick])

  // Transition implementation using GSAP
  function startFullTransition(onComplete){
    if(timelineRef.current) return
    const balls = ballsRef.current
    if(!balls || balls.length === 0) return

    // disable mouse
    let onCompleteCalled = false

    // Compute orbital positions at center (world-space)
    const width = window.innerWidth, height = window.innerHeight
    const cx = width/2, cy = height/2
    const orbitalTargets = balls.map((b, i) => {
      if(b.isCenter) return { x: cx, y: cy }
      const angle = b.isCenter?0:b.orbitAngle
      return { x: cx + Math.cos(angle)*b.orbitRadius, y: cy + Math.sin(angle)*b.orbitRadius }
    })

    // Prepare a simple object array so GSAP can tween positions
    const positions = balls.map(b => ({ x: b.x, y: b.y }))

    const tl = gsap.timeline({ onComplete: () => {
      timelineRef.current = null
      if(onComplete && !onCompleteCalled){ onCompleteCalled = true; onComplete() }
    }})

    timelineRef.current = tl

    // Phase 1: Formation (0.3s)
    tl.to(positions, { duration: 0.3, x: (i)=>orbitalTargets[i].x, y: (i)=>orbitalTargets[i].y, ease: 'power3.out', onUpdate: () => {
      // copy back
      for(let i=0;i<balls.length;i++){ balls[i].x = positions[i].x; balls[i].y = positions[i].y }
    }})

    // Phase 2: scale down to 30% and move group to top-left over 0.6s (start immediately after 0.3s)
    const targetScale = 0.3
    // top-left target: 10% padding from top-left in screen coords, transform to group translation
    const paddingX = 30, paddingY = 30
    const targetGroupX = - (window.innerWidth/2 - paddingX) // move group's center to near left
    const targetGroupY = - (window.innerHeight/2 - paddingY)

    tl.to(groupTransform.current, { duration: 0.6, scale: targetScale, x: targetGroupX, y: targetGroupY, ease: 'power2.inOut', onUpdate: () => {
      // force redraw via requestAnimationFrame by leaving the loop running
    }}, '>-0')

    // Phase 3: Background & content (starts 0.2s after phase 2 start)
    // We do not directly animate DOM content here; App/BackgroundTransition/PortfolioContent listen to phase changes.
    tl.add(() => {}, '+=0.2')

    // after timeline finishes, call onComplete
    return tl
  }

  // Render
  return (
    <div className="intro-root">
      <canvas ref={canvasRef} className="metaball-canvas" />
      <button className="enter-cta mobile" onClick={() => { if(onMobileEnter) onMobileEnter() }} aria-label="Enter site">Enter</button>
    </div>
  )
})

export default MetaballIntro
