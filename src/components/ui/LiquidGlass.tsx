"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

export type LiquidGlassSettings = {
  mode: "preset" | "custom";
  radius: number;
  scale?: number;
  border?: number;
  lightness?: number;
  displace?: number;
  alpha?: number;
  blur?: number;
  dispersion?: number;
  frost?: number;
  borderColor?: string;
};

const preset = {
  scale: 160,
  radius: 50,
  border: 0.05,
  lightness: 53,
  displace: 0.38,
  alpha: 0.9,
  blur: 5,
  dispersion: 50,
  frost: 0.1,
  borderColor: "rgba(120, 120, 120, 0.7)",
};

const DEFAULT_WIDTH = 400;
const DEFAULT_HEIGHT = 200;

export default function LiquidGlass({
  settings,
  className,
  style,
}: {
  settings: LiquidGlassSettings;
  className?: string;
  style?: React.CSSProperties;
}) {
  let config: LiquidGlassSettings & {
    blend: string;
    x: string;
    y: string;
  };

  if (settings.mode === "preset") {
    config = {
      ...preset,
      mode: "preset",
      blend: "difference",
      x: "R",
      y: "B",
      radius: settings.radius,
    };
  } else {
    config = {
      ...settings,
      blend: "difference",
      x: "R",
      y: "B",
    } as typeof config;
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const updateDimensions = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      if (width === 0 || height === 0) return;
      setDimensions({ width, height });
    };
    updateDimensions();
    const ro = new ResizeObserver(updateDimensions);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const displacementDataUri = useMemo(() => {
    const { width, height } = dimensions;
    const newwidth = width / 2;
    const newheight = height / 2;
    const border = Math.min(newwidth, newheight) * ((config.border ?? 0.05) * 0.5);
    const effectiveRadius = Math.min(
      config.radius,
      width / 2,
      height / 2,
    );
    const svgContent = `
      <svg viewBox="0 0 ${newwidth} ${newheight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="red" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="blue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${newwidth}" height="${newheight}" fill="black"/>
        <rect x="0" y="0" width="${newwidth}" height="${newheight}" rx="${effectiveRadius}" fill="url(#red)" />
        <rect x="0" y="0" width="${newwidth}" height="${newheight}" rx="${effectiveRadius}" fill="url(#blue)" style="mix-blend-mode: ${config.blend}" />
        <rect x="${border}" y="${border}" width="${newwidth - border * 2}" height="${newheight - border * 2}" rx="${effectiveRadius}" fill="hsl(0 0% ${config.lightness ?? 53}% / ${config.alpha ?? 0.9})" style="filter:blur(${config.blur ?? 5}px)" />
      </svg>
    `;
    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  }, [dimensions, config]);

  const uid = useId().replace(/:/g, "");
  const filterId = `liquid-glass-filter-${uid}`;

  const glassMorphismStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    borderRadius: config.radius,
    position: "absolute",
    zIndex: 1,
    background: `hsl(0 0% 100% / ${config.frost ?? 0.1})`,
    backdropFilter: `url(#${filterId})`,
    WebkitBackdropFilter: `url(#${filterId})`,
  };

  const gradientBorderStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: config.radius,
    zIndex: 2,
    pointerEvents: "none",
    background: `linear-gradient(315deg, ${config.borderColor} 0%, rgba(120, 120, 120, 0) 30%, rgba(120, 120, 120, 0) 70%, ${config.borderColor} 100%) border-box`,
    mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
    maskComposite: "exclude",
    WebkitMaskComposite: "xor",
    border: "1px solid transparent",
  };

  const disp = config.dispersion ?? 50;
  const scale = config.scale ?? 160;
  const displace = config.displace ?? 0.38;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", position: "relative", ...style }}
    >
      <div style={glassMorphismStyle}>
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter
              id={filterId}
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={displacementDataUri}
                x="0"
                y="0"
                width="100%"
                height="100%"
                result="map"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={scale + disp}
                xChannelSelector={config.x}
                yChannelSelector={config.y}
                result="dispRed"
              />
              <feColorMatrix
                in="dispRed"
                type="matrix"
                values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"
                result="red"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={scale + disp}
                xChannelSelector={config.x}
                yChannelSelector={config.y}
                result="dispGreen"
              />
              <feColorMatrix
                in="dispGreen"
                type="matrix"
                values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0"
                result="green"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="map"
                scale={scale + disp}
                xChannelSelector={config.x}
                yChannelSelector={config.y}
                result="dispBlue"
              />
              <feColorMatrix
                in="dispBlue"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0"
                result="blue"
              />
              <feBlend in="red" in2="green" mode="screen" result="rg" />
              <feBlend in="rg" in2="blue" mode="screen" result="output" />
              <feGaussianBlur in="output" stdDeviation={displace} />
            </filter>
          </defs>
        </svg>
      </div>
      <div id="gradient-border" style={gradientBorderStyle} />
    </div>
  );
}
