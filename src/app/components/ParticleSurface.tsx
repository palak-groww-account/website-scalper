import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

const PARTICLE_COUNT_X = 150;
const PARTICLE_COUNT_Z = 100;
const PARTICLE_SIZE = 1.8;
const WAVE_SPEED = 1.2;
const WAVE_HEIGHT = 3.5;
const COLOR_1 = 0xbded8f;
const COLOR_2 = 0x308698;
const FOG_COLOR = 0x000000;
const FOG_DENSITY = 0.035;

const createCircleTexture = (): THREE.Texture => {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.6)");
  gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.2)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
};

const ParticleSurface = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((event: MouseEvent) => {
    mouseRef.current.x = event.clientX - window.innerWidth / 2;
    mouseRef.current.y = event.clientY - window.innerHeight / 2;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(FOG_COLOR, FOG_DENSITY);

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.y = 10;
    camera.position.z = 25;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const count = PARTICLE_COUNT_X * PARTICLE_COUNT_Z;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const c1 = new THREE.Color(COLOR_1);
    const c2 = new THREE.Color(COLOR_2);

    let idx = 0;
    let cIdx = 0;
    for (let ix = 0; ix < PARTICLE_COUNT_X; ix++) {
      for (let iz = 0; iz < PARTICLE_COUNT_Z; iz++) {
        positions[idx] = (ix - PARTICLE_COUNT_X / 2) * 0.8;
        positions[idx + 1] = 0;
        positions[idx + 2] = (iz - PARTICLE_COUNT_Z / 2) * 0.8;
        idx += 3;

        const t = (ix / PARTICLE_COUNT_X + iz / PARTICLE_COUNT_Z) / 2;
        const particleColor = new THREE.Color().lerpColors(c1, c2, t);
        colors[cIdx] = particleColor.r;
        colors[cIdx + 1] = particleColor.g;
        colors[cIdx + 2] = particleColor.b;
        cIdx += 3;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const circleTexture = createCircleTexture();

    const material = new THREE.PointsMaterial({
      size: PARTICLE_SIZE,
      map: circleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    const clock = new THREE.Clock();

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();
      const posArr = particles.geometry.attributes.position.array as Float32Array;

      let i = 0;
      for (let ix = 0; ix < PARTICLE_COUNT_X; ix++) {
        for (let iz = 0; iz < PARTICLE_COUNT_Z; iz++) {
          const x = posArr[i];
          const z = posArr[i + 2];

          const waveX = Math.sin(x * 0.1 + elapsed * WAVE_SPEED);
          const waveZ = Math.cos(z * 0.1 + elapsed * WAVE_SPEED * 0.5);
          const radial = Math.sin(
            Math.sqrt(x * x + z * z) * 0.15 - elapsed
          );

          posArr[i + 1] = (waveX + waveZ + radial) * WAVE_HEIGHT;
          i += 3;
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;

      particles.rotation.y += 0.001;
      particles.rotation.z += 0.0005;

      camera.rotation.x += 0.05 * (-mouseRef.current.y * 0.0002 - camera.rotation.x);
      camera.rotation.y += 0.05 * (-mouseRef.current.x * 0.0002 - camera.rotation.y);

      renderer.render(scene, camera);
    };

    document.addEventListener("mousemove", handleMouseMove);

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
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      circleTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [handleMouseMove]);

  return (
    <div className="relative w-full h-[100vh] shrink-0">
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{
          maskImage:
            "radial-gradient(circle at center, black 40%, rgba(0,0,0,0.4) 100%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 40%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </div>
  );
};

export default ParticleSurface;
