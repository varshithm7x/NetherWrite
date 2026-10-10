import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ElectricBorderBeam } from "../ui/ElectricBorderBeam";

type GenerationOutcome = "success" | "error" | "cancelled";
type BeginGeneration = () => (outcome: GenerationOutcome) => void;
const GenerationContext = createContext<BeginGeneration>(() => () => {});
const PhaseContext = createContext<"idle" | "generating" | GenerationOutcome>("idle");

/** Every current/future Forge generator reports its lifecycle through this boundary. */
export function ForgeGenerationBoundary({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"idle" | "generating" | GenerationOutcome>("idle");
  const jobs = useRef(new Set<symbol>());
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; jobs.current.clear(); }; }, []);
  const begin = useCallback<BeginGeneration>(() => {
    const job = Symbol();
    jobs.current.add(job);
    setPhase("generating");
    return outcome => {
      if (!jobs.current.delete(job) || !live.current) return;
      setPhase(jobs.current.size ? "generating" : outcome);
    };
  }, []);
  return <GenerationContext.Provider value={begin}>
    <PhaseContext.Provider value={phase}>{children}</PhaseContext.Provider>
  </GenerationContext.Provider>;
}

/** Scope the electricity to the generation control, leaving the surrounding panel clear. */
export function ForgeGenerationButton({ children }: { children: ReactNode }) {
  const phase = useContext(PhaseContext);
  return <ElectricBorderBeam active={phase === "generating"} fadeOut={phase === "success"} borderRadius={13} outset={7}>{children}</ElectricBorderBeam>;
}

export function useForgeGenerationFeedback() {
  const begin = useContext(GenerationContext);
  const finish = useRef<((outcome: GenerationOutcome) => void) | null>(null);
  useEffect(() => () => { finish.current?.("cancelled"); }, []);
  return useCallback(() => {
    finish.current?.("cancelled");
    const complete = begin();
    finish.current = complete;
    return (outcome: GenerationOutcome) => {
      complete(outcome);
      if (finish.current === complete) finish.current = null;
    };
  }, [begin]);
}
