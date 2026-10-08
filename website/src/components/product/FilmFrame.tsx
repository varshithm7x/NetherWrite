import { useRef } from "react";
import { usePointerDepth, useScrollParallax } from "../../lib/motion";

type Props = {
  src?: string;
  poster: string;
  alt: string;
};

export function FilmFrame({ poster, alt }: Props) {
  const ref = useRef<HTMLElement>(null);
  usePointerDepth(ref, { move: 6, tilt: 1 });
  useScrollParallax(ref, { y: 14, scale: 0.028 });

  return (
    <figure className="film-frame" ref={ref}>
      <div className="film-depth" data-depth-inner>
        <img src={poster} alt={alt} className="film-still" data-parallax />
      </div>
    </figure>
  );
}
