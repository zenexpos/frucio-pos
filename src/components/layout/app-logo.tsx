export function AppLogo() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="rounded-lg"
    >
      <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="hsl(var(--primary-foreground))"
        fontSize="16"
        fontFamily="var(--font-inter)"
        fontWeight="bold"
      >
        CZ
      </text>
    </svg>
  );
}
