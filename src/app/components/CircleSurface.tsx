import { useEffect, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT_X = 120;
const PARTICLE_COUNT_Z = 120;
const SPACING = 1.6;
const COLOR_1 = 0xbded8f;
const COLOR_2 = 0x308698;
const FOG_COLOR = 0x050a0a;

const createCircleTexture = (): THREE.Texture => {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();

  const half = size / 2;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.4, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.3)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const CircleSurface = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(FOG_COLOR, 0.002);

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 25, 60);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const positions: number[] = [];
    const colors: number[] = [];
    const c1 = new THREE.Color(COLOR_1);
    const c2 = new THREE.Color(COLOR_2);

    for (let x = 0; x < PARTICLE_COUNT_X; x++) {
      for (let z = 0; z < PARTICLE_COUNT_Z; z++) {
        const px = (x - PARTICLE_COUNT_X / 2) * SPACING;
        const pz = (z - PARTICLE_COUNT_Z / 2) * SPACING;
        positions.push(px, 0, pz);

        const mixed = new THREE.Color().lerpColors(c1, c2, x / PARTICLE_COUNT_X);
        if (Math.random() > 0.85) mixed.lerp(new THREE.Color(0xffffff), 0.15);
        colors.push(mixed.r, mixed.g, mixed.b);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    geometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3)
    );

    const circleTexture = createCircleTexture();

    const material = new THREE.PointsMaterial({
      size: 0.55,
      map: circleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const clock = new THREE.Clock();

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const posArr = particles.geometry.attributes.position.array as Float32Array;

      let i = 0;
      for (let x = 0; x < PARTICLE_COUNT_X; x++) {
        for (let z = 0; z < PARTICLE_COUNT_Z; z++) {
          const px = (x - PARTICLE_COUNT_X / 2) * SPACING;
          const pz = (z - PARTICLE_COUNT_Z / 2) * SPACING;

          const wave1 = Math.sin(px * 0.08 + time * 0.6) * 3.5;
          const wave2 = Math.cos(pz * 0.08 + time * 0.4) * 3.5;
          const wave3 = Math.sin((px + pz) * 0.04 + time * 0.3) * 3.5;

          posArr[i * 3 + 1] = wave1 + wave2 + wave3;
          i++;
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y = time * 0.03;
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

export default CircleSurface;
