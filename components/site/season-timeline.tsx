"use client";

import { useState } from "react";
import { stageDetails } from "@/lib/site-content";

/** Interactive crop-season timeline. The "Now" stage comes live from the season record. */
export function SeasonTimeline({ stages, currentStage }: { stages: string[]; currentStage: string | null }) {
  const nowIdx = Math.max(0, stages.findIndex((s) => s.toLowerCase() === (currentStage ?? "").toLowerCase()));
  const [sel, setSel] = useState(nowIdx);
  const [flip, setFlip] = useState(false);
  const name = stages[sel];
  const d = stageDetails[name] ?? { when: "", desc: "", see: "" };
  const last = stages.length - 1;

  return (
    <div className="tl fade d3">
      <div className="tl-track" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
        <div className="tl-line" />
        <div className="tl-fill" style={{ width: `${((sel / last) * (100 - 100 / stages.length)).toFixed(2)}%`, left: `${(50 / stages.length).toFixed(2)}%` }} />
        {stages.map((s, i) => (
          <button
            key={s}
            className={["tl-stage", i < sel && "passed", i === sel && "active"].filter(Boolean).join(" ")}
            aria-pressed={i === sel}
            onClick={() => {
              setSel(i);
              setFlip((f) => !f);
            }}
          >
            <span className="tl-dot">{String(i + 1).padStart(2, "0")}</span>
            <span className="tl-name">{s}</span>
            {currentStage && i === nowIdx && <span className="tl-now">Now</span>}
          </button>
        ))}
      </div>
      <div className={`card tl-panel ${flip ? "pa" : "pb"}`} aria-live="polite">
        <div>
          <p className="tl-when">{d.when}</p>
          <h3>{name}</h3>
          <p className="desc">{d.desc}</p>
        </div>
        <div className="tl-see">
          <p className="tl-see-label">What you&apos;ll see</p>
          <p>{d.see}</p>
        </div>
      </div>
      <p className="tl-hint">Timings are approximate — the weather sets the real pace. Your dashboard always shows the stage the field is actually in.</p>
    </div>
  );
}
