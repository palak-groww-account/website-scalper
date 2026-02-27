import { useEffect, useRef } from "react";

const SVG_NS = "http://www.w3.org/2000/svg";

const W = 1440;
const H = 900;
const CENTER_X = W / 2;
const CENTER_Y = H / 2;
const VOID_HALF = W * 0.12;
const LINE_COUNT = 30;

const PALETTE = [
  "#BDED8F",
  "#308698",
  "#BDED8F",
  "#308698",
  "#FFFFFF",
  "#BDED8F",
];

const ACCENT = "#308698";

const createGradientStops = (
  defs: SVGDefsElement,
  id: string,
  color: string,
  x1: number,
  x2: number
) => {
  const grad = document.createElementNS(SVG_NS, "linearGradient");
  grad.setAttribute("id", id);
  grad.setAttribute("gradientUnits", "userSpaceOnUse");
  grad.setAttribute("x1", String(x1));
  grad.setAttribute("y1", "0");
  grad.setAttribute("x2", String(x2));
  grad.setAttribute("y2", "0");

  const s1 = document.createElementNS(SVG_NS, "stop");
  s1.setAttribute("offset", "0%");
  s1.setAttribute("stop-color", color);
  grad.appendChild(s1);

  const s2 = document.createElementNS(SVG_NS, "stop");
  s2.setAttribute("offset", "70%");
  s2.setAttribute("stop-color", color);
  s2.setAttribute("stop-opacity", "0.4");
  grad.appendChild(s2);

  const s3 = document.createElementNS(SVG_NS, "stop");
  s3.setAttribute("offset", "100%");
  s3.setAttribute("stop-color", color);
  s3.setAttribute("stop-opacity", "0");
  grad.appendChild(s3);

  defs.appendChild(grad);
};

const BeamComponent = () => {
  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = svgContainerRef.current;
    if (!container) return;

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
    svg.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;display:block;";

    const defs = document.createElementNS(SVG_NS, "defs");

    PALETTE.forEach((color, i) => {
      createGradientStops(defs, `bm-lg-${i}`, color, 0, CENTER_X - VOID_HALF);
      createGradientStops(defs, `bm-rg-${i}`, color, W, CENTER_X + VOID_HALF);
    });

    createGradientStops(defs, "bm-accent-l", ACCENT, 0, CENTER_X - VOID_HALF * 0.6);
    createGradientStops(defs, "bm-accent-r", ACCENT, W, CENTER_X + VOID_HALF * 0.6);

    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", "bm-glow");
    filter.setAttribute("x", "-20%");
    filter.setAttribute("y", "-20%");
    filter.setAttribute("width", "140%");
    filter.setAttribute("height", "140%");
    const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
    blur.setAttribute("stdDeviation", "5");
    blur.setAttribute("result", "b");
    filter.appendChild(blur);
    const merge = document.createElementNS(SVG_NS, "feMerge");
    [["b"], ["SourceGraphic"]].forEach(([inp]) => {
      const mn = document.createElementNS(SVG_NS, "feMergeNode");
      mn.setAttribute("in", inp);
      merge.appendChild(mn);
    });
    filter.appendChild(merge);
    defs.appendChild(filter);

    svg.appendChild(defs);

    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("filter", "url(#bm-glow)");

    const endXL = CENTER_X - VOID_HALF;
    const endXR = CENTER_X + VOID_HALF;

    for (let i = 0; i < LINE_COUNT; i++) {
      const t = i / (LINE_COUNT - 1);
      const y = t * H;

      const distNorm = (y - CENTER_Y) / (H / 2);
      const endY = CENTER_Y + distNorm * (H * 0.06);

      const ci = i % PALETTE.length;
      const baseOpacity = 0.12 + Math.random() * 0.3;
      const sw = 1.2 + Math.random() * 1.8;

      const cp1Frac = 0.3 + Math.random() * 0.1;
      const cp2Frac = 0.65 + Math.random() * 0.1;

      const lPath = `M 0 ${y} C ${endXL * cp1Frac} ${y}, ${endXL * cp2Frac} ${endY}, ${endXL} ${endY}`;
      const rPath = `M ${W} ${y} C ${W - endXL * cp1Frac} ${y}, ${W - endXL * cp2Frac} ${endY}, ${endXR} ${endY}`;

      [
        { d: lPath, grad: `bm-lg-${ci}` },
        { d: rPath, grad: `bm-rg-${ci}` },
      ].forEach(({ d, grad }) => {
        const p = document.createElementNS(SVG_NS, "path");
        p.setAttribute("d", d);
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", `url(#${grad})`);
        p.setAttribute("stroke-width", String(sw));
        p.setAttribute("stroke-opacity", String(baseOpacity));
        g.appendChild(p);

        if (Math.random() > 0.45) {
          const pulse = document.createElementNS(SVG_NS, "path");
          pulse.setAttribute("d", d);
          pulse.setAttribute("fill", "none");
          pulse.setAttribute("stroke", `url(#${grad})`);
          pulse.setAttribute("stroke-width", String(sw + 1.5));
          pulse.setAttribute("stroke-linecap", "round");
          pulse.setAttribute("stroke-dasharray", "50 1100");
          const dur = 3 + Math.random() * 5;
          pulse.style.animation = `beamConverge ${dur}s linear infinite`;
          pulse.style.animationDelay = `${Math.random() * -8}s`;
          pulse.style.opacity = String(Math.min(baseOpacity * 2, 0.7));
          g.appendChild(pulse);
        }
      });
    }

    const addExtraBrightBeam = (
      startX: number,
      gradId: string,
      endX: number,
      yOffset: number,
      width: number,
      opacity: number
    ) => {
      const y = CENTER_Y + yOffset;
      const cp1x =
        startX === 0
          ? endX * 0.3
          : W - (CENTER_X - VOID_HALF) * 0.3;
      const cp2x =
        startX === 0
          ? endX * 0.7
          : W - (CENTER_X - VOID_HALF) * 0.7;
      const d = `M ${startX} ${y} C ${cp1x} ${y}, ${cp2x} ${CENTER_Y + yOffset * 0.2}, ${endX} ${CENTER_Y + yOffset * 0.1}`;
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", `url(#${gradId})`);
      p.setAttribute("stroke-width", String(width));
      p.setAttribute("stroke-opacity", String(opacity));
      g.appendChild(p);
    };

    [
      { yOff: -8, w: 3, o: 0.5 },
      { yOff: 0, w: 2.5, o: 0.6 },
      { yOff: 8, w: 3, o: 0.5 },
    ].forEach(({ yOff, w, o }) => {
      addExtraBrightBeam(0, "bm-accent-l", endXL, yOff, w, o);
      addExtraBrightBeam(W, "bm-accent-r", endXR, yOff, w, o);
    });

    svg.appendChild(g);
    container.appendChild(svg);

    return () => {
      if (container.contains(svg)) container.removeChild(svg);
    };
  }, []);

  return (
    <div className="relative w-full h-full" style={{ minHeight: "100%" }}>
      <style>{`
        @keyframes beamConverge {
          0% { stroke-dashoffset: 1400; }
          100% { stroke-dashoffset: -1400; }
        }
      `}</style>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 28% 55% at 0% 50%, rgba(48, 134, 152, 0.18) 0%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 28% 55% at 100% 50%, rgba(48, 134, 152, 0.18) 0%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 35% 70% at 50% 50%, rgba(0, 0, 0, 0.9) 0%, transparent 100%)",
        }}
      />
      <div ref={svgContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default BeamComponent;
