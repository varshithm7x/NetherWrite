import { useCallback, useRef, useState } from "react";
import { useStoryChapters } from "../../lib/motion";

type Chapter = {
  id: string;
  kicker: string;
  title: string;
  body: string;
  points: readonly string[];
  image: string;
  alt: string;
};

function Copy({ item }: { item: Chapter }) {
  return (
    <>
      <div className="kicker">{item.kicker}</div>
      <h2>{item.title}</h2>
      <p>{item.body}</p>
      <ul className="points">
        {item.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </>
  );
}

export function ProductStory({ chapters }: { chapters: readonly Chapter[] }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const onActive = useCallback((index: number) => setActive(index), []);
  useStoryChapters(root, onActive);
  const current = chapters[active] ?? chapters[0];

  return (
    <section className="story-theater" ref={root} aria-label="Product surfaces">
      <div className="story-pin">
        <div className="story-copy">
          {chapters.map((item, index) => (
            <article
              key={item.id}
              className={`story-copy-card${index === active ? " is-on" : ""}`}
              aria-hidden={index !== active}
            >
              <Copy item={item} />
              <div className="story-count">
                {String(index + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}
              </div>
            </article>
          ))}
        </div>
        <div className="story-frame">
          <div className="story-frame-inner">
            {chapters.map((item, index) => (
              <img
                key={item.id}
                src={item.image}
                alt=""
                className={index === active ? "is-on" : ""}
                aria-hidden={index !== active}
              />
            ))}
            <span className="story-frame-kicker">{current?.kicker}</span>
          </div>
        </div>
      </div>
      <div className="story-track">
        {chapters.map((item) => (
          <article key={item.id} id={item.id} className="story-chapter" data-chapter>
            <div className="story-mobile">
              <Copy item={item} />
              <figure className="film-frame story-chapter-shot">
                <img src={item.image} alt={item.alt} className="film-still" />
              </figure>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
