import { useState, useCallback } from "react";

interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export function useLoader() {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
  });

  const startLoading = useCallback((message?: string) => {
    setLoadingState({ isLoading: true, message });
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState({ isLoading: false });
  }, []);

  return {
    isLoading: loadingState.isLoading,
    message: loadingState.message,
    startLoading,
    stopLoading,
  };
}
