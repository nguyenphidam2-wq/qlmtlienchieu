import React from "react";

export type SolarIconName =
  | "users"
  | "user-check"
  | "user-cross"
  | "map-point"
  | "map"
  | "shield-check"
  | "shield-warning"
  | "shield"
  | "buildings"
  | "building"
  | "chart"
  | "calendar"
  | "danger-circle"
  | "check-circle"
  | "clock"
  | "refresh"
  | "layers";

export type SolarIconSize = "xs" | "sm" | "md" | "lg" | "xl";

interface SolarIconProps extends React.SVGProps<SVGSVGElement> {
  name: SolarIconName;
  size?: SolarIconSize | number;
  className?: string;
  color?: string;
}

const SIZE_MAP: Record<SolarIconSize, number> = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 28,
  xl: 36,
};

/**
 * Solar Duotone Bold Icon Component
 * Cohesive icon style with high-contrast dual-tone opacity for modern UI
 */
export function SolarIcon({
  name,
  size = "md",
  className = "",
  color = "currentColor",
  ...props
}: SolarIconProps) {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] || 22;

  switch (name) {
    case "users":
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <path
            opacity="0.35"
            d="M18.5 19.5C18.5 16.5 15.5 15 12 15C8.5 15 5.5 16.5 5.5 19.5"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="8.5" r="4.5" fill={color} />
          <path
            opacity="0.35"
            d="M19 14C20.5 14.5 22 15.8 22 18"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="18.5" cy="7.5" r="3" fill={color} opacity="0.4" />
        </svg>
      );

    case "user-check":
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <circle cx="10" cy="8" r="4.5" fill={color} />
          <path
            opacity="0.35"
            d="M3 19C3 16 6 14.5 10 14.5C11.5 14.5 12.8 14.7 13.9 15.2"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M15 18.5L17.5 21L22 16"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "user-cross":
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <circle cx="10" cy="8" r="4.5" fill={color} />
          <path
            opacity="0.35"
            d="M3 19C3 16 6 14.5 10 14.5C11.5 14.5 12.8 14.7 13.9 15.2"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M16 16L21 21M21 16L16 21"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case "map-point":
    case "map":
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <ellipse
            opacity="0.3"
            cx="12"
            cy="19.5"
            rx="5.5"
            ry="2.5"
            fill={color}
          />
          <path
            d="M12 2C8.13401 2 5 5.13401 5 9C5 13.5 10.5 19 12 20.5C13.5 19 19 13.5 19 9C19 5.13401 15.866 2 12 2Z"
            fill={color}
          />
          <circle cx="12" cy="8.5" r="2.5" fill="#070b14" />
        </svg>
      );

    case "shield-check":
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <path
            d="M12 2L4 5.5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V5.5L12 2Z"
            fill={color}
            opacity="0.25"
          />
          <path
            d="M12 2L4 5.5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V5.5L12 2Z"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M9 12L11 14L15 10"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "shield-warning":
    case "shield":
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <path
            d="M12 2L4 5.5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V5.5L12 2Z"
            fill={color}
            opacity="0.3"
          />
          <path
            d="M12 2L4 5.5V11.5C4 16.5 7.5 20.8 12 22C16.5 20.8 20 16.5 20 11.5V5.5L12 2Z"
            stroke={color}
            strokeWidth="2"
          />
          <path
            d="M12 8V12"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="12" cy="15.5" r="1.25" fill={color} />
        </svg>
      );

    case "chart":
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <rect
            x="4"
            y="13"
            width="4"
            height="8"
            rx="2"
            fill={color}
            opacity="0.4"
          />
          <rect x="10" y="8" width="4" height="13" rx="2" fill={color} />
          <rect
            x="16"
            y="3"
            width="4"
            height="18"
            rx="2"
            fill={color}
            opacity="0.75"
          />
        </svg>
      );

    case "calendar":
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <rect
            x="3"
            y="6"
            width="18"
            height="15"
            rx="4"
            fill={color}
            opacity="0.25"
          />
          <rect
            x="3"
            y="6"
            width="18"
            height="15"
            rx="4"
            stroke={color}
            strokeWidth="2"
          />
          <path
            d="M3 11H21"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M8 3V7M16 3V7"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case "danger-circle":
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <circle cx="12" cy="12" r="9" fill={color} opacity="0.3" />
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
          <path
            d="M12 7.5V12.5"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="12" cy="16" r="1.25" fill={color} />
        </svg>
      );

    case "check-circle":
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <circle cx="12" cy="12" r="9" fill={color} opacity="0.3" />
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
          <path
            d="M8.5 12L11 14.5L16 9.5"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "clock":
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <circle cx="12" cy="12" r="9" fill={color} opacity="0.25" />
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
          <path
            d="M12 7V12L15 14"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "buildings":
    case "building":
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <rect
            x="3"
            y="7"
            width="11"
            height="14"
            rx="2"
            fill={color}
            opacity="0.3"
          />
          <rect
            x="3"
            y="7"
            width="11"
            height="14"
            rx="2"
            stroke={color}
            strokeWidth="2"
          />
          <path
            d="M14 11H19C20.1 11 21 11.9 21 13V21H14V11Z"
            stroke={color}
            strokeWidth="2"
            fill={color}
            opacity="0.6"
          />
          <circle cx="7" cy="11" r="1" fill={color} />
          <circle cx="10" cy="11" r="1" fill={color} />
          <circle cx="7" cy="15" r="1" fill={color} />
          <circle cx="10" cy="15" r="1" fill={color} />
        </svg>
      );

    case "layers":
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            fill={color}
          />
          <path
            opacity="0.4"
            d="M2 12L12 17L22 12"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            opacity="0.7"
            d="M2 17L12 22L22 17"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "refresh":
    default:
      return (
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          {...props}
        >
          <path
            d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3011 3 18.1883 4.77916 19.7431 7.42857"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M21 4V8H17"
            stroke={color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" fill={color} opacity="0.35" />
        </svg>
      );
  }
}
