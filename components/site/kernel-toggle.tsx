"use client";

import { useState } from "react";
import { SectionHead } from "@/components/site/heads";

export function KernelToggle() {
  const [refined, setRefined] = useState(false);
  return (
    <div className={`kernel${refined ? " refined" : ""}`}>
      <div className="kernel-art fade">
        <div className="toggle" role="group" aria-label="Compare flour types">
          <button className={refined ? "" : "on"} aria-pressed={!refined} onClick={() => setRefined(false)}>
            Whole atta
          </button>
          <button className={refined ? "on" : ""} aria-pressed={refined} onClick={() => setRefined(true)}>
            Refined flour
          </button>
        </div>
        <svg viewBox="0 0 260 340" fill="none" role="img" aria-label="Cross-section of a wheat kernel showing bran, endosperm and germ">
          <ellipse className="k-part k-bran" cx="130" cy="170" rx="96" ry="152" fill="#B4872E" />
          <ellipse className="k-part k-endo" cx="130" cy="166" rx="80" ry="134" fill="#F1E2BF" />
          <path className="k-part k-endo" d="M130 44 C 122 110, 122 220, 130 286" stroke="#D8C290" strokeWidth="2" fill="none" />
          <ellipse className="k-part k-germ" cx="130" cy="290" rx="34" ry="24" fill="#6E5217" />
        </svg>
        <p className="kernel-cap" aria-live="polite">
          {refined
            ? "Refined flour: the bran and germ are removed, leaving only the starchy centre."
            : "Whole atta: bran, endosperm and germ all milled together — the way Mera Khet mills it."}
        </p>
      </div>
      <div>
        <SectionHead num="03 — Milled Whole" title={["The whole grain,", "not two-thirds of it."]} style={{ marginBottom: 10 }} />
        <p className="fade d4" style={{ fontSize: 16.5, lineHeight: 1.78, color: "#4A4A3E", marginTop: 18 }}>
          Every wheat kernel has three parts. Refined flour keeps only the starchy centre. Our atta is milled with all three left in — switch the
          toggle to see what refining takes away.
        </p>
        <ul className="parts fade d5">
          <li className="lost">
            <span className="chip-c" style={{ background: "#B4872E" }} />
            <div>
              <strong>Bran</strong>
              <span>The outer layer, where most of the fibre is.</span>
            </div>
          </li>
          <li>
            <span className="chip-c" style={{ background: "#F1E2BF", border: "1px solid #D8C290" }} />
            <div>
              <strong>Endosperm</strong>
              <span>The starchy centre — the only part refined flour keeps.</span>
            </div>
          </li>
          <li className="lost">
            <span className="chip-c" style={{ background: "#6E5217" }} />
            <div>
              <strong>Germ</strong>
              <span>The seed&apos;s embryo, rich in natural oils and vitamins.</span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
