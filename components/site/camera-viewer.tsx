"use client";

import Image from "next/image";
import { useState } from "react";
import mainField from "@/public/images/cctv/cam-main-field.jpg";
import cropArea from "@/public/images/cctv/cam-crop-area.jpg";
import entrance from "@/public/images/cctv/cam-farm-entrance.jpg";

const cams = [
  { id: "Cam 01", name: "Main Field", status: "Drip irrigation lines · before sowing", photo: mainField },
  { id: "Cam 02", name: "Crop Area", status: "Irrigation tank · drip running", photo: cropArea },
  { id: "Cam 03", name: "Farm Entrance", status: "Gate camera · solar powered", photo: entrance },
];

/**
 * Real still frames from the farm cameras. Deliberately labelled
 * "Still frame · not a live feed" — live camera access is a member
 * benefit that begins at sowing, and a public still must never look
 * like a live stream.
 */
export function CameraViewer() {
  const [i, setI] = useState(0);
  const cam = cams[i];
  return (
    <div className="cam-wrap fade d2">
      <div className="cam-tabs" role="group" aria-label="Choose a camera">
        {cams.map((c, n) => (
          <button key={c.id} className={n === i ? "cam-tab active" : "cam-tab"} aria-pressed={n === i} onClick={() => setI(n)}>
            {c.id} · {c.name}
          </button>
        ))}
      </div>
      <div className="cam-frame">
        <div className="cam-bar">
          <span className="cam-id">
            <span className="cam-dot" />
            {cam.id} — {cam.name}
          </span>
          <span>Still frame · not a live feed</span>
        </div>
        <div className="cam-view">
          <div className="photo-slot dark filled">
            <Image
              key={cam.id}
              className="cam-img"
              src={cam.photo}
              alt={`Still frame from ${cam.id}, ${cam.name}, at the Mera Khet farm in Sujangarh`}
              fill
              sizes="(min-width: 1000px) 920px, 100vw"
              placeholder="blur"
            />
          </div>
          <span className="cam-scan" />
          <span className="cam-corner tl" />
          <span className="cam-corner tr" />
          <span className="cam-corner bl" />
          <span className="cam-corner br" />
        </div>
        <div className="cam-foot">
          <span>{cam.status}</span>
          <span>Sujangarh, Rajasthan</span>
        </div>
      </div>
    </div>
  );
}
