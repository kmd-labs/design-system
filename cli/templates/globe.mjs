/**
 * Generates optional `--globe` Three.js 3D Globe component with 1:1 OrbitControls and live theme reactivity.
 */
export function createGlobeFiles() {
  return [
    [
      'src/app/components/globe/globe.component.html',
      `<canvas #canvasRef id="c"></canvas>\n`
    ],
    [
      'src/app/components/globe/globe.component.scss',
      `:host {
  display: block;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

#c {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}
`
    ],
    [
      'src/app/components/globe/globe.component.ts',
      `import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  effect,
  inject
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ThemeService } from '@kmd/design-system/services/theme.service';

@Component({
  selector: 'app-globe',
  standalone: true,
  templateUrl: './globe.component.html',
  styleUrl: './globe.component.scss'
})
export class GlobeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasRef', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly ngZone = inject(NgZone);
  private readonly theme = inject(ThemeService);

  private readonly R = 10;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private glowMat?: THREE.ShaderMaterial;
  private animId = 0;

  private readonly onResize = () => this.handleResize();

  constructor() {
    effect(() => {
      this.theme.mode();
      if (this.scene) {
        this.scene.background = new THREE.Color(this.theme.getTokenColor('globe-bg', '#f5f7fb'));
      }
      if (this.glowMat) {
        const dark = this.theme.isDark();
        this.glowMat.uniforms['c'].value.set(
          dark ? '#9a3412' : this.theme.getTokenColor('globe-glow', '#0f172a')
        );
        this.glowMat.uniforms['uOpacity'].value = dark ? 0.34 : 0.32;
      }
    });
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      this.initScene();
      window.addEventListener('resize', this.onResize);
      this.animate();
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animId);
    window.removeEventListener('resize', this.onResize);
    this.controls?.dispose();
    this.renderer?.dispose();
  }

  private initScene(): void {
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.theme.getTokenColor('globe-bg', '#f5f7fb'));

    this.camera = new THREE.PerspectiveCamera(40, w / (h || 1), 0.1, 800);
    this.camera.position.set(0, 12, 31);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.14;
    this.controls.minDistance = 12;
    this.controls.maxDistance = 60;
    this.controls.enablePan = false;
    this.controls.target.set(0, 0, 0);
    this.updateOrbitRotateSpeed();
    this.controls.update();

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xdbe4f0, 1.3));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 8);
    this.scene.add(dirLight);

    const sphereMat = new THREE.MeshStandardMaterial({
      color: '#1e3a5f',
      roughness: 0.7,
      metalness: 0.05
    });
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(this.R, 64, 32), sphereMat));

    const dark = this.theme.isDark();
    this.glowMat = new THREE.ShaderMaterial({
      uniforms: {
        c: { value: new THREE.Color(dark ? '#9a3412' : this.theme.getTokenColor('globe-glow', '#0f172a')) },
        uOpacity: { value: dark ? 0.34 : 0.32 },
        uPower: { value: 2.0 }
      },
      vertexShader: \`
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      \`,
      fragmentShader: \`
        uniform vec3 c;
        uniform float uOpacity;
        uniform float uPower;
        varying vec3 vN;
        varying vec3 vV;
        void main() {
          float d = clamp(-dot(vN, vV), 0.0, 1.0);
          float t = clamp(d / 0.4938, 0.0, 1.0);
          float a = pow(t, uPower) * uOpacity;
          gl_FragColor = vec4(c, a);
        }
      \`,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(this.R * 1.15, 64, 32), this.glowMat));
  }

  /** Scales OrbitControls rotateSpeed with camera distance so dragging tracks 1:1 with the globe surface. */
  private updateOrbitRotateSpeed(): void {
    if (!this.controls || !this.camera) return;
    const dist = this.camera.position.length();
    const halfFovRad = THREE.MathUtils.degToRad(this.camera.fov * 0.5);
    const speed = ((dist - this.R) * Math.tan(halfFovRad)) / (Math.PI * this.R);
    this.controls.rotateSpeed = Math.max(0.02, speed);
  }

  private animate = (): void => {
    this.animId = requestAnimationFrame(this.animate);
    this.updateOrbitRotateSpeed();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private handleResize(): void {
    if (!this.canvasRef || !this.renderer || !this.camera) return;
    const canvas = this.canvasRef.nativeElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }
}
`
    ]
  ];
}
