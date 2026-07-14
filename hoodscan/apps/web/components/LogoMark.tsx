export function LogoMark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-bright">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 14 L10 6 L14 12 L20 4"
          stroke="black"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="4" r="2.2" fill="black" />
      </svg>
    </span>
  );
}
