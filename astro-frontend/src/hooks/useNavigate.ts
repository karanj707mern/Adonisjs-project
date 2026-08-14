import { useCallback } from "react";

export function useNavigate() {
  const navigate = useCallback((href: string) => {
    window.location.href = href;
  }, []);

  return { navigate };
}
