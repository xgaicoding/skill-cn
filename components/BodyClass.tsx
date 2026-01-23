"use client";

import { useEffect } from "react";

export default function BodyClass({ className }: { className: string }) {
  useEffect(() => {
    const body = document.body;
    if (!body) return;
    body.classList.add(className);
    return () => {
      body.classList.remove(className);
    };
  }, [className]);

  return null;
}
