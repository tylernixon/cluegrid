"use client";

interface HelpIconProps {
  onClick: () => void;
}

export function HelpIcon({ onClick }: HelpIconProps) {
  return (
    <button
      type="button"
      className="w-10 h-10 flex items-center justify-center rounded-lg text-[#4A8B8D] hover:text-[#3D5A5E] hover:bg-surface-raised dark:hover:bg-surface-raised-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A8B8D] focus-visible:ring-offset-2"
      onClick={onClick}
      aria-label="How to play"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    </button>
  );
}
