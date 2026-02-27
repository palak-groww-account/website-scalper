import { useEffect, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT_X = 60;
const PARTICLE_COUNT_Y = 60;
const PARTICLE_SIZE = 1.8;
const SEPARATION = 1.2;
const WAVE_SPEED = 0.8;
const COLOR_HIGHLIGHT = 0xffffff;
const BG_COLOR = 0x050a0a;

const createCircleTexture = (): THREE.Texture => {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();

  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

const VoidSurface = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(BG_COLOR, 0.035);

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 25;
    camera.position.y = 8;
    camera.rotation.x = -0.3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const count = PARTICLE_COUNT_X * PARTICLE_COUNT_Y;
    const positions = new Float32Array(count * 3);

    let idx = 0;
    for (let ix = 0; ix < PARTICLE_COUNT_X; ix++) {
      for (let iy = 0; iy < PARTICLE_COUNT_Y; iy++) {
        positions[idx] = ix * SEPARATION - (PARTICLE_COUNT_X * SEPARATION) / 2;
        positions[idx + 1] = 0;
        positions[idx + 2] = iy * SEPARATION - (PARTICLE_COUNT_Y * SEPARATION) / 2;
        idx += 3;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const circleTexture = createCircleTexture();

    const material = new THREE.PointsMaterial({
      size: PARTICLE_SIZE,
      map: circleTexture,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: false,
      color: COLOR_HIGHLIGHT,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let time = 0;

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      time += 0.015 * WAVE_SPEED;

      const posArr = particles.geometry.attributes.position.array as Float32Array;

      let i = 0;
      for (let ix = 0; ix < PARTICLE_COUNT_X; ix++) {
        for (let iy = 0; iy < PARTICLE_COUNT_Y; iy++) {
          const x = posArr[i];
          const z = posArr[i + 2];

          const waveX = Math.sin(x * 0.3 + time);
          const waveZ = Math.cos(z * 0.2 + time);
          const distance = Math.sqrt(x * x + z * z);
          const ripple = Math.sin(distance * 0.5 - time * 2) * 1.5;

          posArr[i + 1] = (waveX + waveZ) * 0.5 + ripple;
          i += 3;
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      circleTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};

export default VoidSurface;
