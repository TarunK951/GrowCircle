"use client";

import Link from "next/link";
import {
  useCallback,
  useMemo,
  useState,
  startTransition,
  type CSSProperties,
} from "react";

const lightMap = {
  "top-left": { angle: 135, x: "10%", y: "10%" },
  top: { angle: 180, x: "50%", y: "8%" },
  "top-right": { angle: 225, x: "90%", y: "10%" },
  right: { angle: 270, x: "92%", y: "50%" },
  "bottom-right": { angle: 315, x: "90%", y: "90%" },
  bottom: { angle: 0, x: "50%", y: "92%" },
  "bottom-left": { angle: 45, x: "10%", y: "90%" },
  left: { angle: 90, x: "8%", y: "50%" },
} as const;

export type LightDirection = keyof typeof lightMap;

export type GlassyButtonProps = {
  label: string;
  background?: string;
  hoverBackground?: string;
  textColor?: string;
  borderRadius?: number;
  blur?: number;
  lightDirection?: LightDirection;
  link?: string;
  className?: string;
  style?: CSSProperties;
  shadowHoverColor?: string;
  shadowHoverIntensity?: number;
  type?: "button" | "submit";
  onClick?: () => void;
};

export default function GlassyButton({
  label,
  background = "#FFFFFF33",
  hoverBackground = "#1E3BBD44",
  textColor = "#ffffff",
  borderRadius = 16,
  blur = 18,
  lightDirection = "top-left",
  link,
  className = "",
  style,
  shadowHoverColor = "#0000002D",
  shadowHoverIntensity = 1,
  type = "button",
  onClick,
}: GlassyButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const { angle, x, y } = lightMap[lightDirection];

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      let clientX: number;
      let clientY: number;
      if ("touches" in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ("clientX" in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else return;
      const nx = (clientX - rect.left) / rect.width;
      const ny = (clientY - rect.top) / rect.height;
      startTransition(() =>
        setMouse({
          x: Math.max(0, Math.min(1, nx)),
          y: Math.max(0, Math.min(1, ny)),
        }),
      );
    },
    [],
  );

  const highlightStyle = useMemo((): CSSProperties => {
    const dx = mouse.x - 0.5;
    const dy = mouse.y - 0.5;
    const offsetX = dx * (hovered ? 28 : 16);
    const offsetY = dy * (hovered ? 28 : 16);
    return {
      position: "absolute",
      left: `calc(${x} + ${offsetX}px)`,
      top: `calc(${y} + ${offsetY + (hovered ? -4 : 0)}px)`,
      width: hovered ? "74%" : "60%",
      height: hovered ? "42%" : "30%",
      background: hovered
        ? "linear-gradient(120deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.18) 100%)"
        : "linear-gradient(120deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 100%)",
      borderRadius: "50%",
      filter: `blur(${hovered ? 22 : 14}px)`,
      opacity: hovered ? 0.82 : 0.5,
      pointerEvents: "none",
      transform: `translate(-50%, -50%) scale(${hovered ? 1.13 : 1})${
        hovered ? " translateY(-2.5px)" : ""
      }`,
      transition: "all 0.32s cubic-bezier(.4,0,.2,1)",
      zIndex: 2,
    };
  }, [x, y, hovered, mouse]);

  const reflectionStyle = useMemo((): CSSProperties => {
    const dx = mouse.x - 0.5;
    const dy = mouse.y - 0.5;
    const offsetX = dx * (hovered ? 16 : 8);
    const offsetY = dy * (hovered ? 16 : 8);
    return {
      position: "absolute",
      left: `calc(${x} + ${offsetX}px)`,
      top: `calc(${y} + ${offsetY}px)`,
      width: hovered ? "38%" : "30%",
      height: hovered ? "18%" : "14%",
      background:
        "linear-gradient(120deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 100%)",
      borderRadius: "50%",
      filter: `blur(${hovered ? 10 : 7}px)`,
      opacity: hovered ? 0.45 : 0.28,
      pointerEvents: "none",
      transform: `translate(-50%, -50%) scale(${hovered ? 1.12 : 1})${
        hovered ? " translateY(-1px)" : ""
      }`,
      transition: "all 0.32s cubic-bezier(.4,0,.2,1)",
      zIndex: 1,
    };
  }, [x, y, hovered, mouse]);

  const glassStyle = useMemo(
    (): CSSProperties => ({
      position: "relative",
      minHeight: 48,
      minWidth: 140,
      padding: "0 1.25rem",
      borderRadius,
      background: `linear-gradient(${angle}deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%), ${
        hovered ? hoverBackground : background
      }`,
      boxShadow: hovered
        ? `0 18px ${48 * shadowHoverIntensity}px 0 ${shadowHoverColor}, 0 6px 24px 0 rgba(0,0,0,0.12)`
        : "0 6px 18px 0 rgba(0,0,0,0.10)",
      backdropFilter: `blur(${blur}px) saturate(1.2)`,
      WebkitBackdropFilter: `blur(${blur}px) saturate(1.2)`,
      border: "1.5px solid rgba(255,255,255,0.22)",
      boxSizing: "border-box",
      overflow: "hidden",
      cursor: "pointer",
      transition:
        "box-shadow 0.32s cubic-bezier(.4,0,.2,1), background 0.32s cubic-bezier(.4,0,.2,1), transform 0.32s cubic-bezier(.4,0,.2,1)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      transform: hovered ? "translateY(-11px) scale(1.08)" : "none",
      ...style,
    }),
    [
      angle,
      background,
      borderRadius,
      blur,
      hovered,
      style,
      hoverBackground,
      shadowHoverColor,
      shadowHoverIntensity,
    ],
  );

  const textStyle = useMemo(
    (): CSSProperties => ({
      color: textColor,
      zIndex: 3,
      userSelect: "none",
      fontWeight: 600,
      fontSize: "1rem",
      letterSpacing: "-0.01em",
      lineHeight: "1.2em",
      textAlign: "center",
      pointerEvents: "none",
      transition: "color 0.22s cubic-bezier(.4,0,.2,1)",
    }),
    [textColor],
  );

  const ringStyle: CSSProperties = {
    pointerEvents: "none",
    position: "absolute",
    inset: 0,
    borderRadius,
    border: "1.5px solid rgba(255,255,255,0.22)",
    boxShadow:
      "inset 0 1.5px 8px 0 rgba(255,255,255,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.06)",
    zIndex: 4,
  };

  const shared = {
    className: `border-0 font-inherit text-left ${className}`,
    style: glassStyle,
    "aria-label": label,
    onMouseEnter: () => startTransition(() => setHovered(true)),
    onMouseLeave: () => {
      startTransition(() => setMouse({ x: 0.5, y: 0.5 }));
      startTransition(() => setHovered(false));
    },
    onFocus: () => startTransition(() => setHovered(true)),
    onBlur: () => startTransition(() => setHovered(false)),
    onMouseMove: handleMouseMove,
    onTouchMove: handleMouseMove,
  };

  const inner = (
    <>
      <div style={highlightStyle} />
      <div style={reflectionStyle} />
      <span style={textStyle}>{label}</span>
      <div style={ringStyle} />
    </>
  );

  if (link) {
    return (
      <Link
        href={link}
        {...shared}
        className={`${shared.className} inline-flex no-underline`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} {...shared} onClick={onClick}>
      {inner}
    </button>
  );
}
