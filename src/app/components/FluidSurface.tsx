import { useEffect, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT_X = 100;
const PARTICLE_COUNT_Z = 100;
const SEPARATION = 4;

const VERTEX_SHADER = `
  attribute float scale;
  attribute vec3 color;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = scale * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAGMENT_SHADER = `
  varying vec3 vColor;
  void main() {
    if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
    gl_FragColor = vec4(vColor, 1.0);
  }
`;

const FluidSurface = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060809, 0.0015);

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 100;
    camera.position.y = 40;
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const numParticles = PARTICLE_COUNT_X * PARTICLE_COUNT_Z;
    const positions = new Float32Array(numParticles * 3);
    const scales = new Float32Array(numParticles);
    const colors = new Float32Array(numParticles * 3);

    const colorLow = new THREE.Color(0x666666);
    const colorHigh = new THREE.Color(0xffffff);

    let i = 0;
    let j = 0;
    for (let ix = 0; ix < PARTICLE_COUNT_X; ix++) {
      for (let iz = 0; iz < PARTICLE_COUNT_Z; iz++) {
        positions[i] = ix * SEPARATION - (PARTICLE_COUNT_X * SEPARATION) / 2;
        positions[i + 1] = 0;
        positions[i + 2] = iz * SEPARATION - (PARTICLE_COUNT_Z * SEPARATION) / 2;
        scales[j] = 1;
        colors[i] = 1;
        colors[i + 1] = 1;
        colors[i + 2] = 1;
        i += 3;
        j++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("scale", new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0xffffff) },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let count = 0;

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);

      camera.lookAt(scene.position);

      count += 0.05;

      const posArr = particles.geometry.attributes.position.array as Float32Array;
      const colArr = particles.geometry.attributes.color.array as Float32Array;
      const scaleArr = particles.geometry.attributes.scale.array as Float32Array;

      let pi = 0;
      let si = 0;

      for (let ix = 0; ix < PARTICLE_COUNT_X; ix++) {
        for (let iz = 0; iz < PARTICLE_COUNT_Z; iz++) {
          const wave1 = Math.sin((ix + count) * 0.3) * 10;
          const wave2 = Math.sin((iz + count) * 0.5) * 10;
          const wave3 = Math.sin((ix + iz + count) * 0.2) * 5;

          posArr[pi + 1] = wave1 + wave2 + wave3;

          const height = posArr[pi + 1];
          const alpha = (height + 25) / 50;

          colArr[pi] = THREE.MathUtils.lerp(colorLow.r, colorHigh.r, alpha);
          colArr[pi + 1] = THREE.MathUtils.lerp(colorLow.g, colorHigh.g, alpha);
          colArr[pi + 2] = THREE.MathUtils.lerp(colorLow.b, colorHigh.b, alpha);

          scaleArr[si] = alpha * 3 + 0.5;

          pi += 3;
          si++;
        }
      }

      particles.geometry.attributes.position.needsUpdate = true;
      particles.geometry.attributes.color.needsUpdate = true;
      particles.geometry.attributes.scale.needsUpdate = true;

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

export default FluidSurface;
