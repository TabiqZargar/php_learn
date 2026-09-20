import { useId } from "react";

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Shared visual language for the desktop. Each icon is drawn inline so the
 * app has no image dependencies and every instance gets its own gradient ids.
 */

function iconFrame(
  id: string,
  symbol: React.ReactNode,
  fillTop: string,
  fillBottom: string,
) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fillTop} />
          <stop offset="0.18" stopColor={fillTop} />
          <stop offset="1" stopColor={fillBottom} />
        </linearGradient>
        <linearGradient id={`${id}-gloss`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000000" stopOpacity="0.4" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse
        cx={24}
        cy={45}
        rx={19}
        ry={3.4}
        fill={`url(#${id}-shadow)`}
      />
      <rect
        x={5}
        y={4}
        width={38}
        height={38}
        rx={5}
        fill={`url(#${id}-fill)`}
        stroke="#ffffff"
        strokeOpacity="0.55"
        strokeWidth="1"
      />
      <rect
        x={6}
        y={5}
        width={36}
        height={17}
        rx={3}
        fill={`url(#${id}-gloss)`}
      />
      {symbol}
    </>
  );
}

function glyphText(id: string, label: string) {
  return (
    <text
      x={24}
      y={31}
      textAnchor="middle"
      fontSize="15"
      fontWeight="800"
      fontStyle="italic"
      fill="#ffffff"
      stroke="#0a2a66"
      strokeWidth="0.5"
      fontFamily="Tahoma, 'Segoe UI', sans-serif"
    >
      {label}
    </text>
  );
}

export function AcademyIcon({ className, size = 48 }: IconProps) {
  const id = useId();
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {iconFrame(id, glyphText(id, "php"), "#3f8cf5", "#1b4f9c")}
    </svg>
  );
}

export function ProgramsIcon({ className, size = 48 }: IconProps) {
  const id = useId();
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {iconFrame(
        id,
        <g stroke="#ffffff" strokeOpacity="0.9" strokeWidth="2" fill="none">
          <path d="M24 15 V31 M13 23 H35" strokeLinecap="round" />
          <circle cx={24} cy={31} r={2.2} fill="#ffffff" />
        </g>,
        "#5fd14e",
        "#1e7a24",
      )}
    </svg>
  );
}

export function ReferenceIcon({ className, size = 48 }: IconProps) {
  const id = useId();
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-book`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8b43a" />
          <stop offset="1" stopColor="#d97b12" />
        </linearGradient>
        <linearGradient id={`${id}-pages`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9e5da" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000000" stopOpacity="0.4" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={24} cy={44.6} rx={19} ry={3.2} fill={`url(#${id}-shadow)`} />
      <path
        d="M9 10 C14 7 18 8 24 10 V38 C18 36 14 35 9 38 Z"
        fill={`url(#${id}-book)`}
        stroke="#a65a08"
        strokeWidth="1.4"
      />
      {/* opened page edge */}
      <path
        d="M24 10 C30 8 34 7 39 10 V38 C34 35 30 36 24 38 Z"
        fill={`url(#${id}-pages)`}
        stroke="#a7a38f"
        strokeWidth="1"
      />
      <path d="M15 17 H21 M15 23 H21" stroke="#b9b4a2" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 30 H35" stroke="#a65a08" strokeOpacity="0.5" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ComputerIcon({ className, size = 48 }: IconProps) {
  const id = useId();
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-screen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7ec3f7" />
          <stop offset="0.5" stopColor="#3f8ae0" />
          <stop offset="1" stopColor="#1c5cb0" />
        </linearGradient>
        <linearGradient id={`${id}-bezel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f8f7f1" />
          <stop offset="0.55" stopColor="#cfccc0" />
          <stop offset="1" stopColor="#a9a69a" />
        </linearGradient>
        <radialGradient id={`${id}-shadow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000000" stopOpacity="0.4" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={24} cy={45} rx={19} ry={3.2} fill={`url(#${id}-shadow)`} />
      <rect
        x={7}
        y={6}
        width={34}
        height={25}
        rx={1.6}
        fill={`url(#${id}-bezel)`}
        stroke="#6f6d63"
        strokeWidth="1.1"
      />
      <rect
        x={9.6}
        y={8.6}
        width={28.8}
        height={19.8}
        fill={`url(#${id}-screen)`}
      />
      {/* glossy sweep on the screen */}
      <path
        d="M9.6 8.6 H38.4 V16.5 C30 12.5 17 12.5 9.6 16.5 Z"
        fill="#ffffff"
        opacity="0.22"
      />
      {/* tiny sun */}
      <circle cx={31} cy={16} r={4} fill="#ffe9a8" opacity="0.9" />
      <rect x={19} y={31} width={10} height={3} rx={0.8} fill="#8d8a7e" stroke="#66645a" strokeWidth="0.8" />
      <rect x={28} y={31.5} width={9} height={2.5} rx={0.8} fill="#a9a69a" stroke="#66645a" strokeWidth="0.7" />
    </svg>
  );
}

/** Small green "start" flag used on the Start button. */
export function StartFlagIcon({ className, size = 18 }: IconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 18 18"
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 2.5 L3 15.5 M3.4 3.5 C5 2.9 7 2.9 8.6 3.8 C10.2 4.7 12 4.7 13.6 4.2 L13.6 9.5 C12 10 10.2 10 8.6 9.1 C7 8.2 5 8.2 3.4 8.8 Z"
        fill="#ffffff"
        opacity="0.95"
        stroke="#1b5c12"
        strokeWidth="0.6"
      />
      <path
        d="M3.4 8.8 C5 8.2 7 8.2 8.6 9.1 C10.2 10 12 10 13.6 9.5 L13.6 14.8 C12 15.3 10.2 15.3 8.6 14.4 C7 13.5 5 13.5 3.4 14.1 Z"
        fill="#ffffff"
        opacity="0.5"
        stroke="#1b5c12"
        strokeWidth="0.6"
      />
    </svg>
  );
}