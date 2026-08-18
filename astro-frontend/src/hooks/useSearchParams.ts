"use client";

import { useEffect, useState } from "react";

export default function useSearchParams(): URLSearchParams {
  const [params, setParams] = useState(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  });

  useEffect(() => {
    const handler = () =>
      setParams(new URLSearchParams(window.location.search));
    window.addEventListener("popstate", handler);
    window.addEventListener("astro:after-swap", handler);
    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener("astro:after-swap", handler);
    };
  }, []);

  return params;
}
