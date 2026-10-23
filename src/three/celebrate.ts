import * as THREE from 'three'

// Physics-based 3D confetti, rendered on a transparent overlay canvas above
// the UI. Each piece gets velocity, gravity, quadratic drag, tumble and a
// slight flutter — the same feel as AAA mobile celebration effects.

interface Piece {
  vel: THREE.Vector3
  angVel: THREE.Vector3
  flutter: number
  life: number
}

const PALETTE = [0xff8a3d, 0xffc94d, 0x34d399, 0x38bdf8, 0xf472b6, 0xa78bfa, 0xffffff]

class Celebrations {
  private renderer: THREE.WebGLRenderer | null = null
  private scene = new THREE.Scene()
  private camera = new THREE.OrthographicCamera()
  private mesh: THREE.InstancedMesh | null = null
  private pieces: Piece[] = []
  private dummy = new THREE.Object3D()
  private raf = 0
  private clock = new THREE.Clock()

  private ensure(): void {
    if (this.renderer) return
    const r = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    r.setPixelRatio(Math.min(2, window.devicePixelRatio))
    r.setSize(window.innerWidth, window.innerHeight)
    r.domElement.style.cssText =
      'position:fixed;inset:0;pointer-events:none;z-index:9999;'
    document.body.appendChild(r.domElement)
    this.renderer = r
    this.resize()
    window.addEventListener('resize', () => this.resize())
  }

  private resize(): void {
    const w = window.innerWidth, h = window.innerHeight
    this.camera.left = 0; this.camera.right = w
    this.camera.top = 0; this.camera.bottom = h
    this.camera.near = -500; this.camera.far = 500
    this.camera.updateProjectionMatrix()
    this.renderer?.setSize(w, h)
  }

  /** Fire a burst. x/y in viewport px (defaults: center / upper third). */
  burst(x = window.innerWidth / 2, y = window.innerHeight * 0.35, count = 90): void {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    this.ensure()

    const geo = new THREE.PlaneGeometry(10, 14)
    // NB: instance colors come from setColorAt/instanceColor — setting
    // vertexColors would make the shader read a missing attribute (black).
    const mat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    const mesh = new THREE.InstancedMesh(geo, mat, count)
    const color = new THREE.Color()
    const pieces: Piece[] = []

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const power = 260 + Math.random() * 620
      pieces.push({
        vel: new THREE.Vector3(
          Math.cos(angle) * power,
          Math.sin(angle) * power * 0.9 - 420,   // biased upward (screen y grows down)
          (Math.random() - 0.5) * 200,
        ),
        angVel: new THREE.Vector3(
          (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18,
        ),
        flutter: Math.random() * Math.PI * 2,
        life: 1.6 + Math.random() * 1.2,
      })
      this.dummy.position.set(x, y, 0)
      this.dummy.scale.setScalar(0.6 + Math.random() * 0.8)
      this.dummy.updateMatrix()
      mesh.setMatrixAt(i, this.dummy.matrix)
      mesh.setColorAt(i, color.setHex(PALETTE[i % PALETTE.length]))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    this.scene.add(mesh)

    // Track per-instance state alongside a single instanced mesh per burst.
    ;(mesh as unknown as { __pieces: Piece[] }).__pieces = pieces
    this.pieces = pieces
    this.mesh = mesh

    if (!this.raf) {
      this.clock.start()
      this.loop()
    }
  }

  private loop = (): void => {
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min(0.033, this.clock.getDelta())
    const G = 1500          // px/s² gravity
    const DRAG = 0.0016     // quadratic drag coefficient
    let alive = 0

    for (const obj of [...this.scene.children]) {
      const mesh = obj as THREE.InstancedMesh & { __pieces: Piece[] }
      const pieces = mesh.__pieces
      if (!pieces) continue
      let meshAlive = 0
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i]
        p.life -= dt
        mesh.getMatrixAt(i, this.dummy.matrix)
        this.dummy.matrix.decompose(this.dummy.position, this.dummy.quaternion, this.dummy.scale)
        if (p.life <= 0) {
          this.dummy.scale.setScalar(0)
        } else {
          meshAlive++
          const speed = p.vel.length()
          const drag = p.vel.clone().multiplyScalar(-DRAG * speed * dt)
          p.vel.add(drag)
          p.vel.y += G * dt
          p.flutter += dt * 9
          this.dummy.position.x += (p.vel.x + Math.sin(p.flutter) * 40) * dt
          this.dummy.position.y += p.vel.y * dt
          this.dummy.position.z += p.vel.z * dt
          this.dummy.rotation.set(
            this.dummy.rotation.x + p.angVel.x * dt,
            this.dummy.rotation.y + p.angVel.y * dt,
            this.dummy.rotation.z + p.angVel.z * dt,
          )
          if (p.life < 0.4) this.dummy.scale.setScalar(this.dummy.scale.x * (p.life / 0.4))
        }
        this.dummy.updateMatrix()
        mesh.setMatrixAt(i, this.dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
      if (meshAlive === 0) {
        this.scene.remove(mesh)
        mesh.geometry.dispose()
        ;(mesh.material as THREE.Material).dispose()
      }
      alive += meshAlive
    }

    this.renderer?.render(this.scene, this.camera)
    if (alive === 0) {
      cancelAnimationFrame(this.raf)
      this.raf = 0
      this.renderer?.clear()
    }
  }
}

export const celebrate = new Celebrations()
