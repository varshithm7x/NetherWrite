import { useRef, type ReactNode } from "react";
import { useScrollFade } from "../lib/motion";

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFade(ref);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
