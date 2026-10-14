import type { ReactNode } from "react";
import { ArrowDown, ArrowRight } from "lucide-react";

type Props = {
  href: string;
  variant?: "primary" | "secondary" | "light";
  size?: "sm" | "md" | "lg";
  arrow?: "right" | "down";
  className?: string;
  onClick?: () => void;
  children: ReactNode;
};

/** Anchor-style CTA. One component so every CTA shares variants, spacing and motion. */
export default function CtaLink({ href, variant = "primary", size = "md", arrow = "right", className = "", onClick, children }: Props) {
  const Icon = arrow === "down" ? ArrowDown : ArrowRight;
  return (
    <a href={href} onClick={onClick} className={`btn btn--${variant} btn--${size} btn--${arrow} ${className}`.trim()}>
      <span>{children}</span>
      <Icon className="btn__icon" size={18} aria-hidden="true" />
    </a>
  );
}
