import type { SVGProps } from "react";

const GlowingLeafIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="128"
    height="128"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2a6 6 0 0 1 0 12 6 6 0 0 1 0-12" fill="hsl(var(--primary))" className="opacity-90" />
    <path d="M2 22c6-6 8-6 14-6s6 6 6 6H2z" fill="hsl(var(--primary))" className="opacity-80" />
    <path d="M12 22V15c0-2 2-4 4-4" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" />
    <path d="M12 18c-2 0-3-1-3-2" stroke="hsl(var(--primary-foreground))" strokeWidth="1.5" />
  </svg>
);
export default GlowingLeafIcon;
