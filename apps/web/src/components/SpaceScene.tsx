import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';

interface SpaceSceneProps {
  progressRef: MutableRefObject<number>;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function createGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(255,240,205,0.9)');
  gradient.addColorStop(1, 'rgba(255,240,205,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export function SpaceScene({ progressRef }: SpaceSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.z = 12;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const glowTexture = createGlowTexture();

    // 멀리 있는 고정 별밭 — 수렴하지 않고 배경으로만 은은히 회전한다.
    const bgStarCount = 1400;
    const bgPositions = new Float32Array(bgStarCount * 3);
    for (let i = 0; i < bgStarCount; i++) {
      const radius = 28 + Math.random() * 45;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      bgPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      bgPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      bgPositions[i * 3 + 2] = radius * Math.cos(phi);
    }
    const bgGeometry = new THREE.BufferGeometry();
    bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    const bgMaterial = new THREE.PointsMaterial({
      map: glowTexture,
      color: 0x9fb4ff,
      size: 0.18,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const bgStars = new THREE.Points(bgGeometry, bgMaterial);
    scene.add(bgStars);

    // 스크롤에 따라 중심으로 모이는 빛 입자.
    const particleCount = 900;
    const originalPositions = new Float32Array(particleCount * 3);
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 4 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      map: glowTexture,
      color: 0xffe4b8,
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 마지막에 태어나는 하나의 큰 빛 (가벼운 스프라이트 기반 발광).
    const coreMaterial = new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0xfff2d6,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Sprite(coreMaterial);
    core.scale.setScalar(0.001);
    scene.add(core);

    const clock = new THREE.Clock();
    let raf = 0;
    const posAttr = particleGeometry.attributes.position as THREE.BufferAttribute;

    // 디스플레이 주사율과 무관하게 렌더 루프를 ~60fps로 제한한다.
    const MIN_FRAME_INTERVAL_MS = 1000 / 60;
    let lastFrameTime = 0;

    function animate(now: number) {
      raf = requestAnimationFrame(animate);
      if (now - lastFrameTime < MIN_FRAME_INTERVAL_MS) return;
      lastFrameTime = now;

      const elapsed = clock.getElapsedTime();
      const progress = progressRef.current;
      const eased = easeInOutCubic(progress);

      // 스크롤에 따라 장면 전체가 서서히 회전한다.
      scene.rotation.y = elapsed * 0.02 + progress * Math.PI * 2;
      scene.rotation.x = Math.sin(elapsed * 0.1) * 0.05 + progress * 0.6;
      bgStars.rotation.y = elapsed * 0.005;

      // 초중반에는 천천히 모이다가, 후반에 급격히 수렴하도록 곡선을 눌러준다.
      const convergence = eased * eased;
      for (let i = 0; i < particleCount; i++) {
        const shrink = 1 - convergence * 0.94;
        posAttr.array[i * 3] = originalPositions[i * 3] * shrink;
        posAttr.array[i * 3 + 1] = originalPositions[i * 3 + 1] * shrink;
        posAttr.array[i * 3 + 2] = originalPositions[i * 3 + 2] * shrink;
      }
      posAttr.needsUpdate = true;
      particleMaterial.size = 0.35 + convergence * 0.5;

      const coreProgress = Math.min(1, Math.max(0, (progress - 0.65) / 0.35));
      const coreEased = easeInOutCubic(coreProgress);
      core.scale.setScalar(0.001 + coreEased * 9);
      coreMaterial.opacity = coreEased;

      camera.position.z = 12 - eased * 4;

      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(animate);

    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      container.removeChild(renderer.domElement);
      particleGeometry.dispose();
      particleMaterial.dispose();
      bgGeometry.dispose();
      bgMaterial.dispose();
      coreMaterial.dispose();
      glowTexture.dispose();
      renderer.dispose();
    };
  }, [progressRef]);

  return <div ref={containerRef} className="space-scene" />;
}
