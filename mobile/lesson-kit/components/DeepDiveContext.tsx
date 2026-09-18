/**
 * Which lesson the reading view belongs to, so the deep layer can be fetched
 * on demand from inside the reader without threading props through every beat.
 */
import React, { createContext, useContext } from 'react';

interface DeepDiveTarget {
  stackId?: string;
  learningGoal?: string | null;
}

const DeepDiveContext = createContext<DeepDiveTarget>({});

export function DeepDiveProvider({
  stackId,
  learningGoal,
  children,
}: DeepDiveTarget & { children: React.ReactNode }) {
  return (
    <DeepDiveContext.Provider value={{ stackId, learningGoal }}>{children}</DeepDiveContext.Provider>
  );
}

export function useDeepDiveTarget(): DeepDiveTarget {
  return useContext(DeepDiveContext);
}
