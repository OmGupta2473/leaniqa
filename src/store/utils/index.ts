// Shared Zustand utilities (e.g., custom middlewares, persist configuration generators)
export const createPersistConfig = <T>(name: string, partialize?: (state: T) => Partial<T>) => ({
  name,
  ...(partialize && { partialize }),
});
