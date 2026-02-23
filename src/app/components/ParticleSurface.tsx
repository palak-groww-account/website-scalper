import { useEffect, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT_X = 100;
const PARTICLE_COUNT_Z = 100;
const SPACING = 1.5;
const COLOR_1 = 0xbded8f;
const COLOR_2 = 0x308698;
const FOG_COLOR = 0x050a0a;

const ParticleSurface = () => {
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
    camera.position.set(0, 20, 50);
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
        if (Math.random() > 0.8) mixed.lerp(new THREE.Color(0xffffff), 0.2);
        colors.push(mixed.r, mixed.g, mixed.b);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.42,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - window.innerWidth / 2) * 0.1;
      mouseY = (event.clientY - window.innerHeight / 2) * 0.1;
    };
    document.addEventListener("mousemove", handleMouseMove);

    const clock = new THREE.Clock();

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const posArr = particles.geometry.attributes.position.array as Float32Array;

      let i = 0;
      for (let x = 0; x < PARTICLE_COUNT_X; x++) {
        for (let z = 0; z < PARTICLE_COUNT_Z; z++) {
          const px = posArr[i * 3];
          const pz = posArr[i * 3 + 2];
          const wave1 = Math.sin(px * 0.1 + time * 0.8) * 2.5;
          const wave2 = Math.cos(pz * 0.1 + time * 0.5) * 2.5;
          const wave3 = Math.sin((px + pz) * 0.05 + time * 0.4) * 2.5;
          posArr[i * 3 + 1] = wave1 + wave2 + wave3;
          i++;
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;
      targetX = mouseX * 0.5;
      targetY = mouseY * 0.5;
      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (-targetY + 20 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      particles.rotation.y = time * 0.04;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[100vh] shrink-0">
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{
          maskImage: "radial-gradient(circle at center, black 40%, rgba(0,0,0,0.4) 100%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 40%, rgba(0,0,0,0.4) 100%)",
        }}
      />
    </div>
  );
};

export default ParticleSurface;
