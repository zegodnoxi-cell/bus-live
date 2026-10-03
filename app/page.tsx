"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/map-app.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <main className="w-screen h-screen">
      <div
        id="map"
        className="w-full h-full"
      />
    </main>
  );
}