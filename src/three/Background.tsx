import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Full-viewport ambient scene rendered behind the UI: a dusk-in-Bangkok
// gradient sky, drifting paper lanterns, and a soft firefly particle field,
// all with gentle mouse parallax. GPU-light: one draw call per element type.

const SKY_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0);
  }
`

const SKY_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;

  // Dusk palette: deep indigo above, warm marigold glow at the horizon.
  void main() {
    vec3 top     = vec3(0.043, 0.078, 0.157);   // #0b1428
    vec3 mid     = vec3(0.098, 0.129, 0.247);   // #19213f
    vec3 horizon = vec3(0.949, 0.522, 0.216);   // #f28537
    vec3 glow    = vec3(1.000, 0.760, 0.400);

    float y = vUv.y;
    vec3 col = mix(mid, top, smoothstep(0.35, 1.0, y));
    float h = smoothstep(0.42, 0.0, y);
    col = mix(col, horizon, h * 0.85);
    // Sun bloom, breathing very slowly.
    float d = distance(vUv, vec2(0.5, 0.02));
    float bloom = exp(-d * d * 9.0) * (0.75 + 0.05 * sin(uTime * 0.4));
    col += glow * bloom * 0.55;
    // Subtle film grain so gradients never band.
    float g = fract(sin(dot(vUv * 1234.0, vec2(12.9898, 78.233))) * 43758.5453);
    col += (g - 0.5) * 0.012;
    gl_FragColor = vec4(col, 1.0);
  }
`

interface Lantern {
  mesh: THREE.Sprite
  speed: number
  sway: number
  phase: number
}

export default function Background(): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = ref.current
    if (!host) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    renderer.setSize(window.innerWidth, window.innerHeight)
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0, 10)

    // Sky — full-screen triangle-pair drawn behind everything.
    const skyUniforms = { uTime: { value: 0 } }
    const sky = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
        uniforms: skyUniforms, depthWrite: false, depthTest: false,
      }),
    )
    sky.renderOrder = -1
    sky.frustumCulled = false
    scene.add(sky)

    // Fireflies — one instanced point cloud with additive glow.
    const N = 140
    const positions = new Float32Array(N * 3)
    const seeds = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14
      positions[i * 3 + 2] = -4 - Math.random() * 6
      seeds[i] = Math.random() * Math.PI * 2
    }
    const fireflyGeo = new THREE.BufferGeometry()
    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const fireflyMat = new THREE.PointsMaterial({
      color: 0xffd27a, size: 0.09, transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    })
    const fireflies = new THREE.Points(fireflyGeo, fireflyMat)
    scene.add(fireflies)

    // Paper lanterns — soft radial-glow sprites drifting upward. Sprites with
    // additive blending always read as LIGHT, never as muddy solids.
    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = glowCanvas.height = 128
    const gctx = glowCanvas.getContext('2d')!
    const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(255, 214, 140, 0.95)')
    grad.addColorStop(0.25, 'rgba(255, 170, 80, 0.55)')
    grad.addColorStop(0.6, 'rgba(255, 130, 50, 0.16)')
    grad.addColorStop(1, 'rgba(255, 120, 40, 0)')
    gctx.fillStyle = grad
    gctx.fillRect(0, 0, 128, 128)
    const glowTex = new THREE.CanvasTexture(glowCanvas)

    // Lanterns live in the far margins only — never behind the content column,
    // where a soft glow reads as a smudge over text.
    const lanterns: Lantern[] = []
    const lanternTints = [0xffc98a, 0xffab5e, 0xffe0a0, 0xff9a76]
    const edgeX = () => (9 + Math.random() * 4.5) * (Math.random() < 0.5 ? -1 : 1)
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.SpriteMaterial({
        map: glowTex, color: lanternTints[i % lanternTints.length],
        transparent: true, opacity: 0.28,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })
      const mesh = new THREE.Sprite(mat)
      mesh.position.set(edgeX(), -8 + Math.random() * 16, -3 - Math.random() * 5)
      mesh.scale.setScalar(0.55 + Math.random() * 0.65)
      scene.add(mesh)
      lanterns.push({ mesh, speed: 0.14 + Math.random() * 0.22, sway: 0.4 + Math.random() * 0.8, phase: Math.random() * Math.PI * 2 })
    }

    // Mouse parallax, critically damped so it never feels twitchy.
    const target = new THREE.Vector2()
    const eye = new THREE.Vector2()
    const onMove = (e: PointerEvent) => {
      target.set((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2)
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    const clock = new THREE.Clock()
    let raf = 0
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      skyUniforms.uTime.value = t

      if (!reduced) {
        eye.lerp(target, 0.03)
        camera.position.x = eye.x * 0.7
        camera.position.y = -eye.y * 0.45
        camera.lookAt(0, 0, 0)

        const pos = fireflyGeo.attributes.position as THREE.BufferAttribute
        for (let i = 0; i < N; i++) {
          const s = seeds[i]
          pos.setY(i, pos.getY(i) + Math.sin(t * 0.5 + s) * 0.0016)
          pos.setX(i, pos.getX(i) + Math.cos(t * 0.35 + s * 1.7) * 0.0012)
        }
        pos.needsUpdate = true
        ;(fireflyMat as THREE.PointsMaterial).opacity = 0.65 + 0.25 * Math.sin(t * 0.8)

        for (const l of lanterns) {
          l.mesh.position.y += l.speed * 0.016
          l.mesh.position.x += Math.sin(t * l.sway + l.phase) * 0.004
          l.mesh.material.opacity = 0.22 + 0.12 * Math.sin(t * 1.3 + l.phase)
          if (l.mesh.position.y > 9) {
            l.mesh.position.y = -9
            l.mesh.position.x = (9 + Math.random() * 4.5) * (Math.random() < 0.5 ? -1 : 1)
          }
        }
      }
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={ref} className="bg3d" aria-hidden="true" />
}
