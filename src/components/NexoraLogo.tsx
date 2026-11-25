import React from 'react';

interface NexoraLogoProps {
  size?: number;
  className?: string;
}

export const NexoraLogo: React.FC<NexoraLogoProps> = ({ size = 24, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="8"
        className="fill-zinc-900 dark:fill-zinc-100"
      />
      <path
        d="M10.5 21.5V10.5L21.5 21.5V10.5"
        className="stroke-white dark:stroke-zinc-900"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="21.5"
        cy="10.5"
        r="1.75"
        className="fill-blue-400 dark:fill-blue-600"
      />
    </svg>
  );
};
