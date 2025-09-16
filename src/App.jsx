import { useEffect, useState, useRef } from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import './App.css'

void motion;

const EASE_OUT_SOFT = [0.22, 1, 0.36, 1]
const EASE_IN_OUT_SOFT = [0.45, 0, 0.55, 1]
const PAGE_TRANSITION_DURATION = 0.5
const HOVER_TRANSITION_DURATION = 0.28

function useDarkMode() {
	const [isDark, setIsDark] = useState(false)
	useEffect(() => {
		const rootElement = document.documentElement
		if (isDark) rootElement.classList.add('dark')
		else rootElement.classList.remove('dark')
	}, [isDark])
	return { isDark, toggle: () => setIsDark((v) => !v) }
}

function BubbleLayer() {
	const canvasRef = useRef(null)
	const mouseRef = useRef({ x: 0, y: 0 })
	const rafRef = useRef(0)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d', { alpha: true })
		if (!ctx) return

		let width = canvas.width = window.innerWidth
		let height = canvas.height = window.innerHeight

		const handleResize = () => {
			width = canvas.width = window.innerWidth
			height = canvas.height = window.innerHeight
		}
		window.addEventListener('resize', handleResize)

		const bubbles = []
		const burstBubbles = []
		const spawn = (nearMouse = false) => {
			const baseX = nearMouse ? mouseRef.current.x : Math.random() * width
			const baseY = nearMouse ? mouseRef.current.y : Math.random() * height
			bubbles.push({
				x: baseX + (Math.random() - 0.5) * 80,
				y: baseY + (Math.random() - 0.5) * 80,
				vx: (Math.random() - 0.5) * 0.6,
				vy: (Math.random() - 0.5) * 0.6,
				r: 18 + Math.random() * 30,
				h: Math.random() * 360,
				life: 1.0,
				decay: 0.006 + Math.random() * 0.008,
			})
		}
		const initialCount = Math.min(80, Math.floor((width * height) / 24000))
		for (let i = 0; i < initialCount; i++) spawn(false)
		const spawnInterval = setInterval(() => spawn(true), 140)

		const handleMouseMove = (e) => {
			mouseRef.current.x = e.clientX
			mouseRef.current.y = e.clientY
		}
		window.addEventListener('mousemove', handleMouseMove)

		const createBurst = (x, y) => {
			const burstCount = 8 + Math.floor(Math.random() * 12)
			for (let i = 0; i < burstCount; i++) {
				const angle = (Math.PI * 2 * i) / burstCount + Math.random() * 0.5
				const speed = 2 + Math.random() * 4
				burstBubbles.push({
					x, y,
					vx: Math.cos(angle) * speed,
					vy: Math.sin(angle) * speed,
					r: 12 + Math.random() * 20,
					h: Math.random() * 360,
					life: 1.0,
					decay: 0.02 + Math.random() * 0.03,
				})
			}
		}

		const handleClick = (e) => createBurst(e.clientX, e.clientY)
		window.addEventListener('click', handleClick)
		window.addEventListener('contextmenu', handleClick)
		const handleMouseDown = (e) => createBurst(e.clientX, e.clientY)
		window.addEventListener('mousedown', handleMouseDown)
		const handleTouchStart = (e) => {
			const t = e.touches[0]
			if (t) createBurst(t.clientX, t.clientY)
		}
		window.addEventListener('touchstart', handleTouchStart, { passive: true })

		const step = () => {
			ctx.clearRect(0, 0, width, height)
			ctx.globalCompositeOperation = 'lighter'

			for (let i = bubbles.length - 1; i >= 0; i--) {
				const b = bubbles[i]
				const dx = mouseRef.current.x - b.x
				const dy = mouseRef.current.y - b.y
				const distance = Math.hypot(dx, dy) || 1
				const force = Math.min(0.04, 60 / (distance * distance))
				b.vx += dx * force
				b.vy += dy * force

				b.vx *= 0.96
				b.vy *= 0.96
				b.x += b.vx
				b.y += b.vy

				if (b.x < -50) b.x = width + 50
				if (b.x > width + 50) b.x = -50
				if (b.y < -50) b.y = height + 50
				if (b.y > height + 50) b.y = -50

				b.h = (b.h + 0.2) % 360
				b.life -= b.decay
				const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
				gradient.addColorStop(0, `hsla(${b.h}, 90%, 65%, ${Math.max(0, Math.min(0.85, b.life))})`)
				gradient.addColorStop(1, `hsla(${(b.h + 40) % 360}, 90%, 55%, 0.0)`)
				ctx.fillStyle = gradient
				ctx.beginPath()
				ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
				ctx.fill()
				if (b.life <= 0) bubbles.splice(i, 1)
			}

			for (let i = burstBubbles.length - 1; i >= 0; i--) {
				const b = burstBubbles[i]
				b.x += b.vx
				b.y += b.vy
				b.vx *= 0.95
				b.vy *= 0.95
				b.life -= b.decay
				if (b.life <= 0) { burstBubbles.splice(i, 1); continue }
				const alpha = b.life * 0.9
				const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
				gradient.addColorStop(0, `hsla(${b.h}, 95%, 70%, ${alpha})`)
				gradient.addColorStop(1, `hsla(${(b.h + 60) % 360}, 95%, 60%, 0.0)`)
				ctx.fillStyle = gradient
				ctx.beginPath()
				ctx.arc(b.x, b.y, b.r * b.life, 0, Math.PI * 2)
				ctx.fill()
			}

			rafRef.current = requestAnimationFrame(step)
		}
		step()

		return () => {
			cancelAnimationFrame(rafRef.current)
			window.removeEventListener('resize', handleResize)
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('click', handleClick)
			window.removeEventListener('contextmenu', handleClick)
			window.removeEventListener('mousedown', handleMouseDown)
			window.removeEventListener('touchstart', handleTouchStart)
			clearInterval(spawnInterval)
		}
	}, [])

	return (
		<canvas ref={canvasRef} className="pointer-events-none fixed inset-0 -z-10" />
	)
}

function CursorSmoke() {
	const canvasRef = useRef(null)
	const rafRef = useRef(0)
	const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
	const isActiveRef = useRef(false)
	const lastActiveAtRef = useRef(Date.now())
	const fadeRef = useRef(0)

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d', { alpha: true })
		if (!ctx) return

		let width = canvas.width = window.innerWidth
		let height = canvas.height = window.innerHeight

		const handleResize = () => {
			width = canvas.width = window.innerWidth
			height = canvas.height = window.innerHeight
		}
		window.addEventListener('resize', handleResize)
		const makeActive = (x, y) => {
			if (typeof x === 'number' && typeof y === 'number') { mouse.current.x = x; mouse.current.y = y }
			isActiveRef.current = true
			lastActiveAtRef.current = Date.now()
		}
		const handleMove = (e) => makeActive(e.clientX, e.clientY)
		window.addEventListener('mousemove', handleMove)
		const handleTouchMove = (e) => { const t = e.touches[0]; if (t) makeActive(t.clientX, t.clientY) }
		const handleTouchStart = (e) => { const t = e.touches[0]; if (t) makeActive(t.clientX, t.clientY) }
		const handleTouchEnd = () => { isActiveRef.current = false }
		window.addEventListener('touchmove', handleTouchMove, { passive: true })
		window.addEventListener('touchstart', handleTouchStart, { passive: true })
		window.addEventListener('touchend', handleTouchEnd)
		window.addEventListener('touchcancel', handleTouchEnd)

		const particles = []
		const spawn = () => {
			for (let i = 0; i < 6; i++) {
				particles.push({
					x: mouse.current.x + (Math.random() - 0.5) * 10,
					y: mouse.current.y + (Math.random() - 0.5) * 10,
					vx: (Math.random() - 0.5) * 0.6,
					vy: (Math.random() - 0.5) * 0.6 - 0.2,
					r: 10 + Math.random() * 24,
					h: Math.random() * 360,
					life: 1,
					decay: 0.02 + Math.random() * 0.03,
				})
			}
		}

		const step = () => {
			const now = Date.now()
			if (now - lastActiveAtRef.current > 600) isActiveRef.current = false
			const targetFade = isActiveRef.current ? 1 : 0
			fadeRef.current += (targetFade - fadeRef.current) * 0.12
			canvas.style.opacity = String(fadeRef.current)

			ctx.clearRect(0, 0, width, height)
			ctx.globalCompositeOperation = 'lighter'
			if (isActiveRef.current) spawn()
			for (let i = particles.length - 1; i >= 0; i--) {
				const p = particles[i]
				p.x += p.vx
				p.y += p.vy
				p.vx *= 0.98
				p.vy *= 0.98
				p.h = (p.h + 1) % 360
				p.life -= p.decay * (isActiveRef.current ? 1 : 2.8)
				const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
				gradient.addColorStop(0, `hsla(${p.h}, 100%, 65%, ${Math.max(0, Math.min(0.9, p.life))})`)
				gradient.addColorStop(1, `hsla(${(p.h + 40) % 360}, 100%, 55%, 0.0)`)
				ctx.fillStyle = gradient
				ctx.beginPath()
				ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
				ctx.fill()
				if (p.life <= 0) particles.splice(i, 1)
			}
			rafRef.current = requestAnimationFrame(step)
		}
		step()

		return () => {
			cancelAnimationFrame(rafRef.current)
			window.removeEventListener('resize', handleResize)
			window.removeEventListener('mousemove', handleMove)
			window.removeEventListener('touchmove', handleTouchMove)
			window.removeEventListener('touchstart', handleTouchStart)
			window.removeEventListener('touchend', handleTouchEnd)
			window.removeEventListener('touchcancel', handleTouchEnd)
		}
	}, [])

	return (
		<canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 mix-blend-screen" />
	)
}

const Container = ({ children }) => (
	<div className="min-h-screen relative flex flex-col">
		<BubbleLayer />
		<CursorSmoke />
		{children}
	</div>
)

function Navbar({ onToggleDark, isDark }) {
  return (
		<header className="sticky top-0 z-50 backdrop-blur text-white dark:text-gray-900 shadow bg-gradient-to-r from-gray-800 via-gray-900 to-black dark:from-white dark:via-gray-100 dark:to-gray-300 relative overflow-hidden" role="banner">
			<BubbleBand />
			<nav className="mx-auto max-w-6xl px-4 py-5 flex items-center justify-between text-lg relative" aria-label="Primary">
				<div className="flex items-center gap-2 font-bold">
					<span className="w-3 h-3 rounded-full bg-brand-600" aria-hidden="true" />
					<span className="text-2xl md:text-3xl tracking-tight font-hand">PortFolio</span>
      </div>
				<MobileMenu onToggleDark={onToggleDark} isDark={isDark} />
				<div className="hidden md:flex items-center gap-6 font-semibold">
					<NavLink to="/" end className={({isActive}) => `hover:text-brand-300 dark:hover:text-brand-600 ${isActive ? 'text-brand-300 dark:text-brand-600' : ''}`}>Home</NavLink>
					<NavLink to="/about" className={({isActive}) => `hover:text-brand-300 dark:hover:text-brand-600 ${isActive ? 'text-brand-300 dark:text-brand-600' : ''}`}>About</NavLink>
					<NavLink to="/projects" className={({isActive}) => `hover:text-brand-300 dark:hover:text-brand-600 ${isActive ? 'text-brand-300 dark:text-brand-600' : ''}`}>Projects</NavLink>
					<NavLink to="/contact" className={({isActive}) => `hover:text-brand-300 dark:hover:text-brand-600 ${isActive ? 'text-brand-300 dark:text-brand-600' : ''}`}>User</NavLink>
					<button onClick={onToggleDark} aria-label="Toggle dark mode" className="px-3 py-1 rounded-md border border-white/30 dark:border-gray-300 text-white dark:text-gray-900 bg-transparent">
						{isDark ? 'Light' : 'Dark'}
        </button>
				</div>
			</nav>
		</header>
	)
}

function MobileMenu({ onToggleDark, isDark }) {
	const [open, setOpen] = useState(false)
	return (
		<div className="md:hidden">
			<button
				onClick={() => setOpen((v) => !v)}
				aria-label="Toggle menu"
				aria-expanded={open}
				className="inline-flex items-center justify-center rounded-md border border-white/30 dark:border-gray-300 px-3 py-2 text-white dark:text-gray-900"
			>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					{open ? (
						<path d="M18 6L6 18M6 6l12 12" />
					) : (
						<>
							<line x1="3" y1="6" x2="21" y2="6" />
							<line x1="3" y1="12" x2="21" y2="12" />
							<line x1="3" y1="18" x2="21" y2="18" />
						</>
					)}
				</svg>
			</button>
			{open && (
				<AnimatePresence>
					<motion.div
						initial={{ opacity: 0, y: -8, scaleY: 0.98, clipPath: 'inset(0 0 100% 0)' }}
						animate={{ opacity: 1, y: 0, scaleY: 1, clipPath: 'inset(0 0 0% 0)' }}
						exit={{ opacity: 0, y: -8, scaleY: 0.98, clipPath: 'inset(0 0 100% 0)' }}
						transition={{ duration: 0.35, ease: EASE_OUT_SOFT }}
						className="mt-3 rounded-lg border border-white/30 dark:border-gray-300 bg-white/90 dark:bg-gray-100/90 text-gray-900 shadow-lg overflow-hidden"
						style={{ transformOrigin: 'top' }}
					>
						<div className="flex flex-col divide-y divide-gray-200">
							<NavLink onClick={() => setOpen(false)} to="/" end className={({isActive}) => `px-4 py-3 ${isActive ? 'bg-gray-100' : ''}`}>Home</NavLink>
							<NavLink onClick={() => setOpen(false)} to="/about" className={({isActive}) => `px-4 py-3 ${isActive ? 'bg-gray-100' : ''}`}>About</NavLink>
							<NavLink onClick={() => setOpen(false)} to="/projects" className={({isActive}) => `px-4 py-3 ${isActive ? 'bg-gray-100' : ''}`}>Projects</NavLink>
							<NavLink onClick={() => setOpen(false)} to="/contact" className={({isActive}) => `px-4 py-3 ${isActive ? 'bg-gray-100' : ''}`}>User</NavLink>
							<button onClick={() => { setOpen(false); onToggleDark() }} className="px-4 py-3 text-left">{isDark ? 'Light' : 'Dark'}</button>
						</div>
					</motion.div>
				</AnimatePresence>
			)}
		</div>
	)
}

function BubbleBand() {
	const canvasRef = useRef(null)
	const rafRef = useRef(0)
	const mouseRef = useRef({ x: 0, y: 0, inside: false })

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d', { alpha: true })
		if (!ctx) return
		const parent = canvas.parentElement
		if (!parent) return

		let width = 0, height = 0
		const resizeToParent = () => {
			const rect = parent.getBoundingClientRect()
			width = canvas.width = Math.max(1, Math.floor(rect.width))
			height = canvas.height = Math.max(1, Math.floor(rect.height))
		}
		resizeToParent()
		const ro = new ResizeObserver(resizeToParent)
		ro.observe(parent)

		const bubbles = []
		const spawn = (x, y) => {
			bubbles.push({
				x: x ?? Math.random() * width,
				y: y ?? Math.random() * height,
				vx: (Math.random() - 0.5) * 0.4,
				vy: (Math.random() - 0.5) * 0.4,
				r: 10 + Math.random() * 24,
				h: Math.random() * 360,
				life: 1,
				decay: 0.01 + Math.random() * 0.015,
			})
		}
		for (let i = 0; i < 24; i++) spawn()
		const interval = setInterval(() => { if (bubbles.length < 120) spawn() }, 220)

		const handleMove = (e) => {
			const rect = parent.getBoundingClientRect()
			mouseRef.current.x = e.clientX - rect.left
			mouseRef.current.y = e.clientY - rect.top
			mouseRef.current.inside =
				e.clientX >= rect.left && e.clientX <= rect.right &&
				e.clientY >= rect.top && e.clientY <= rect.bottom
		}
		window.addEventListener('mousemove', handleMove)

		const burst = (x, y) => {
			for (let i = 0; i < 10 + Math.random() * 10; i++) {
				const a = (Math.PI * 2 * i) / 12 + Math.random() * 0.5
				const s = 1.5 + Math.random() * 3
				bubbles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: 12 + Math.random() * 22, h: Math.random() * 360, life: 1, decay: 0.02 + Math.random() * 0.03 })
			}
		}
		const handleClick = (e) => {
			const rect = parent.getBoundingClientRect()
			burst(e.clientX - rect.left, e.clientY - rect.top)
		}
		parent.addEventListener('click', handleClick)
		parent.addEventListener('contextmenu', handleClick)
		parent.addEventListener('mousedown', handleClick)
		parent.addEventListener('touchstart', (e) => {
			const t = e.touches[0]
			if (!t) return
			const rect = parent.getBoundingClientRect()
			burst(t.clientX - rect.left, t.clientY - rect.top)
		}, { passive: true })

		const step = () => {
			ctx.clearRect(0, 0, width, height)
			ctx.globalCompositeOperation = 'lighter'
			for (let i = bubbles.length - 1; i >= 0; i--) {
				const b = bubbles[i]
				if (mouseRef.current.inside) {
					const dx = mouseRef.current.x - b.x
					const dy = mouseRef.current.y - b.y
					const distance = Math.hypot(dx, dy) || 1
					const force = Math.min(0.03, 50 / (distance * distance))
					b.vx += dx * force
					b.vy += dy * force
				}
				b.vx *= 0.97
				b.vy *= 0.97
				b.x += b.vx
				b.y += b.vy
				b.h = (b.h + 0.15) % 360
				b.life -= b.decay
				const gradient = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
				gradient.addColorStop(0, `hsla(${b.h}, 90%, 65%, ${Math.max(0, Math.min(0.8, b.life))})`)
				gradient.addColorStop(1, `hsla(${(b.h + 40) % 360}, 90%, 55%, 0.0)`)
				ctx.fillStyle = gradient
				ctx.beginPath()
				ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
				ctx.fill()
				if (b.life <= 0) bubbles.splice(i, 1)
			}
			rafRef.current = requestAnimationFrame(step)
		}
		step()

		return () => {
			cancelAnimationFrame(rafRef.current)
			window.removeEventListener('mousemove', handleMove)
			parent.removeEventListener('click', handleClick)
			parent.removeEventListener('contextmenu', handleClick)
			parent.removeEventListener('mousedown', handleClick)
			ro.disconnect()
			clearInterval(interval)
		}
	}, [])

	return (
		<canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
	)
}

const PageWrapper = ({ children }) => (
	<AnimatePresence mode="wait">
		<motion.main
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -12 }}
			transition={{ duration: PAGE_TRANSITION_DURATION, ease: EASE_OUT_SOFT }}
			className="mx-auto max-w-6xl px-4 py-12"
			style={{ willChange: 'transform, opacity' }}
		>
			{children}
		</motion.main>
	</AnimatePresence>
)

function Home() {
	return (
		<PageWrapper>
			<div className="relative min-h-[80vh] grid place-items-center">
				<section className="relative rounded-[28px] overflow-hidden shadow-2xl max-w-6xl mx-auto">
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: EASE_OUT_SOFT }}
						className="pointer-events-none absolute right-6 top-6 h-28 w-52 md:h-40 md:w-80 rounded-xl border border-white/30 bg-white/10 backdrop-blur-sm shadow-lg"
						style={{ willChange: 'transform, opacity' }}
					/>
					<div className="relative z-10 grid md:grid-cols-2">
						<div className="bg-white dark:bg-gray-900 p-10 md:p-14 text-gray-900 dark:text-gray-100">
							<p className="text-brand-600 font-semibold font-hand text-3xl dark:text-white">Nirbhik Shrestha</p>
							<h1 className="mt-3 text-3xl md:text-5xl font-extrabold leading-tight text-gray-900 dark:text-white">Hello,My name's Nirbhik. I'm a Programmer and a Developer...,also learning day by day.</h1>
							<p className="mt-4 text-gray-700 dark:text-gray-300">I love to build and love to learn.</p>
						</div>
						<div className="relative bg-indigo-700 min-h-[360px] md:min-h-full p-10 overflow-hidden">
							<div className="pointer-events-none absolute inset-0">
								<div className="morph-blob" />
								<div className="morph-blob" />
								<div className="morph-blob" />
							</div>
							<div className="absolute inset-x-0 bottom-0 h-1/3 bg-indigo-600/60 dark:bg-indigo-900/60" />
							<motion.div
								initial={{ y: 20, opacity: 0, rotate: -3 }}
								animate={{ y: [0, -10, 0], rotate: [-3, 3, -3], opacity: 1 }}
								transition={{ duration: 6, repeat: Infinity, repeatType: 'mirror', ease: EASE_IN_OUT_SOFT, delay: 0.1 }}
								className="absolute left-10 top-16"
								style={{ willChange: 'transform, opacity' }}
							>
								<div className="w-20 h-20 bg-white/70 dark:bg-gray-800/70 rounded-md shadow-xl backdrop-blur" />
							</motion.div>
							<motion.div
								initial={{ y: 20, opacity: 0, rotate: 2 }}
								animate={{ y: [0, -12, 0], rotate: [2, -2, 2], opacity: 1 }}
								transition={{ duration: 7, repeat: Infinity, repeatType: 'mirror', ease: EASE_IN_OUT_SOFT, delay: 0.2 }}
								className="absolute left-36 top-44"
								style={{ willChange: 'transform, opacity' }}
							>
								<div className="w-20 h-20 bg-orange-300 dark:bg-orange-600 rounded-md shadow-xl backdrop-blur" />
							</motion.div>
							<motion.div
								initial={{ y: 20, opacity: 0, rotate: 0 }}
								animate={{ y: [0, -8, 0], rotate: [0, 4, 0], opacity: 1 }}
								transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: EASE_IN_OUT_SOFT, delay: 0.3 }}
								className="absolute left-44 top-24"
								style={{ willChange: 'transform, opacity' }}
							>
								<div className="w-24 h-24 rounded-xl bg-indigo-500 dark:bg-indigo-700 shadow-2xl" />
							</motion.div>
							<motion.div
								initial={{ y: -10, opacity: 1 }}
								animate={{ y: [10, -10, 10] }}
								transition={{ duration: 3.2, repeat: Infinity, repeatType: 'mirror', ease: EASE_IN_OUT_SOFT }}
								className="absolute right-16 top-40"
								style={{ willChange: 'transform' }}
							>
								<div className="w-6 h-6 bg-orange-400 dark:bg-orange-500 rounded-full shadow-xl" />
							</motion.div>
							<motion.div
								initial={{ y: 15, opacity: 0, rotate: -6 }}
								animate={{ y: [0, -14, 0], rotate: [-6, 6, -6], opacity: 1 }}
								transition={{ duration: 6.5, repeat: Infinity, repeatType: 'mirror', ease: EASE_IN_OUT_SOFT, delay: 0.4 }}
								className="absolute right-10 top-10"
								style={{ willChange: 'transform, opacity' }}
							>
								<div className="w-14 h-14 bg-cyan-300 dark:bg-cyan-600 rounded-lg shadow-xl backdrop-blur" />
							</motion.div>
							<motion.div
								initial={{ y: 20, opacity: 0, rotate: 0 }}
								animate={{ y: [0, -10, 0], rotate: [0, 8, 0], opacity: 1 }}
								transition={{ duration: 7.5, repeat: Infinity, repeatType: 'mirror', ease: EASE_IN_OUT_SOFT, delay: 0.6 }}
								className="absolute left-20 bottom-12"
								style={{ willChange: 'transform, opacity' }}
							>
								<div className="w-16 h-16 bg-pink-300 dark:bg-pink-600 rounded-full shadow-2xl" />
							</motion.div>
							<motion.div
								initial={{ y: 10, opacity: 0, rotate: -8 }}
								animate={{ y: [-6, 6, -6], rotate: [-8, 8, -8], opacity: 1 }}
								transition={{ duration: 8.5, repeat: Infinity, repeatType: 'mirror', ease: EASE_IN_OUT_SOFT, delay: 0.8 }}
								className="absolute right-32 top-24"
								style={{ willChange: 'transform, opacity' }}
							>
								<div className="w-10 h-24 bg-lime-300/80 dark:bg-lime-600/70 rounded-md shadow-xl" />
							</motion.div>
							<motion.div
								initial={{ y: 18, opacity: 0, rotate: 5 }}
								animate={{ y: [0, -14, 0], rotate: [5, -5, 5], opacity: 1 }}
								transition={{ duration: 7, repeat: Infinity, repeatType: 'mirror', ease: EASE_IN_OUT_SOFT, delay: 1 }}
								className="absolute right-6 bottom-10"
								style={{ willChange: 'transform, opacity' }}
							>
								<div className="w-12 h-12 bg-emerald-300 dark:bg-emerald-600 rounded-xl shadow-xl" />
							</motion.div>
							<motion.div
								initial={{ y: -12, opacity: 0, rotate: 0 }}
								animate={{ y: [-10, 10, -10], rotate: [0, 10, 0], opacity: 1 }}
								transition={{ duration: 9, repeat: Infinity, repeatType: 'mirror', ease: EASE_IN_OUT_SOFT, delay: 0.5 }}
								className="absolute left-10 top-8"
								style={{ willChange: 'transform, opacity' }}
							>
								<div className="w-8 h-20 bg-fuchsia-300/80 dark:bg-fuchsia-600/70 rounded-lg shadow-2xl" />
							</motion.div>
							<motion.div
								initial={{ y: 0, opacity: 0, rotate: -12 }}
								animate={{ y: [6, -6, 6], rotate: [-12, 12, -12], opacity: 1 }}
								transition={{ duration: 10, repeat: Infinity, repeatType: 'mirror', ease: EASE_IN_OUT_SOFT, delay: 0.3 }}
								className="absolute right-24 bottom-20"
								style={{ willChange: 'transform, opacity' }}
							>
								<div className="w-24 h-10 bg-yellow-300/80 dark:bg-yellow-500/70 rounded-full shadow-xl" />
							</motion.div>
							<motion.div
								initial={{ y: 14, opacity: 0, rotate: 0 }}
								animate={{ y: [-8, 8, -8], rotate: [0, -6, 0], opacity: 1 }}
								transition={{ duration: 6.8, repeat: Infinity, repeatType: 'mirror', ease: EASE_IN_OUT_SOFT, delay: 1.2 }}
								className="absolute left-1/2 top-1/3"
								style={{ willChange: 'transform, opacity' }}
							>
								<div className="w-14 h-14 bg-sky-300/80 dark:bg-sky-600/70 rounded-2xl shadow-xl" />
							</motion.div>
						</div>
					</div>
				</section>


			</div>
		</PageWrapper>
	)
}

function About() {
	return (
		<PageWrapper>
			<div className="mx-auto max-w-3xl">
				<div className="rounded-2xl border border-white/20 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 backdrop-blur shadow-xl p-6 sm:p-8">
					<h2 className="text-3xl font-bold">About Me</h2>
					<p className="mt-4 text-gray-700 dark:text-gray-300">I’m a passionate and curious developer with a knack for turning ideas into functional, impactful projects. From building intelligent systems like AI-driven planners and air quality monitors to crafting user-friendly websites and automation tools, I thrive on solving real-world problems through code. My portfolio reflects a blend of creativity, technical skill, and a drive to keep learning whether it's working with sensors, Python applications, or AI-powered solutions. I believe in building technology that’s not just smart, but meaningful.</p>
				</div>
			</div>
		</PageWrapper>
	)
}

function Projects() {
	const items = [
		{ id: 'p1', title: 'Smart Air Quality Monitoring System', description: 'Tracks real-time air pollution using IoT sensors and cloud-based data visualization.', link: '#'},
		{ id: 'p2', title: 'PIR Sensor with DC Motor and 9V Battery', description: 'Activates a motor when motion is detected, showcasing basic automation.', link: '#'},
		{ id: 'p3', title: 'Ultrasonic Sensor with LCD (I2C)', description: 'Measures and displays object distance using an ultrasonic sensor and I2C LCD.', link: '#'},
		{ id: 'p4', title: 'PIR Sensor with Buzzer and LED using Arduino', description: 'Triggers sound and light alerts when motion is detected via Arduino.', link: '#'},
		{ id: 'p5', title: 'Pet Store Website', description: 'An e-commerce site for pet products with responsive design and secure checkout.', link: '#'},
		{ id: 'p6', title: 'AI-Driven Study Planner', description: 'Uses AI to create and adjust personalized study schedules for better productivity.', link: '#'},
		{ id: 'p7', title: 'Hospital Management System using Python', description: 'Manages patient data, appointments, and billing through a Python-based interface.', link: '#'},
		{ id: 'p8', title: 'AI-Enabled Fixed-Wing RC Plane System', description: 'Performs aerial surveillance and data analysis using AI-powered RC aircraft.', link: '#'}
	]
	return (
		<PageWrapper>
			<h2 id="projects" className="text-2xl font-semibold">Projects</h2>
			<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{items.map((p, i) => (
					<motion.div key={p.id ?? i} whileHover={{ y: -4 }} transition={{ type: 'tween', duration: HOVER_TRANSITION_DURATION, ease: EASE_OUT_SOFT }} className="block rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md bg-white/85 dark:bg-gray-900/60 backdrop-blur-sm cursor-default select-none" style={{ willChange: 'transform, box-shadow' }}>
						<h3 className="font-medium text-base leading-tight">{p.title}</h3>
						<p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{p.description}</p>
						{p.tags && <div className="mt-2 text-[10px] text-gray-500">{p.tags.join(', ')}</div>}
					</motion.div>
				))}
			</div>
		</PageWrapper>
	)
}

function Contact() {
	const handleSubmit = (e) => {
		e.preventDefault()
		const form = new FormData(e.currentTarget)
		const data = Object.fromEntries(form.entries())
		console.log('Contact form submitted:', data)
	}
	return (
		<PageWrapper>
			<h2 id="contact" className="text-4xl font-bold">Contact</h2>
			<form className="mt-6 grid gap-4 w-full max-w-4xl md:grid-cols-2" onSubmit={handleSubmit}>
				<input name="name" className="px-5 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-900/60 backdrop-blur text-base md:col-span-1" placeholder="Name" required aria-label="Your name" />
				<input name="email" type="email" className="px-5 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-900/60 backdrop-blur text-base md:col-span-1" placeholder="Email" required aria-label="Your email" />
				<textarea name="message" rows="6" className="px-5 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-900/60 backdrop-blur text-base md:col-span-2" placeholder="Message" required aria-label="Your message" />
				<button className="justify-self-start px-6 py-3 rounded-lg bg-brand-600 text-white text-base md:col-span-2" aria-label="Send message">Send</button>
			</form>
		</PageWrapper>
	)
}

function Footer() {
	return (
		<footer className="mt-auto text-white dark:text-gray-900 shadow-inner bg-gradient-to-r from-gray-800 via-gray-900 to-black dark:from-white dark:via-gray-100 dark:to-gray-300 relative overflow-hidden">
			<BubbleBand />
			<div className="mx-auto max-w-6xl px-4 py-6 text-sm flex items-center justify-between relative">
				<span>© {new Date().getFullYear()} Nirbhik Shrestha(James)</span>
				<a href="https://github.com/NS-10-23" className="hover:text-brand-300 dark:hover:text-brand-600">GitHub</a>
			</div>
		</footer>
	)
}

export default function App() {
	const { isDark, toggle } = useDarkMode()
	return (
		<BrowserRouter>
			<MotionConfig reducedMotion="user" transition={{ duration: PAGE_TRANSITION_DURATION, ease: EASE_OUT_SOFT }}>
				<Container>
					<Navbar onToggleDark={toggle} isDark={isDark} />
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/about" element={<About />} />
						<Route path="/projects" element={<Projects />} />
						<Route path="/contact" element={<Contact />} />
					</Routes>
					<Footer />
				</Container>
			</MotionConfig>
		</BrowserRouter>
	)
}
