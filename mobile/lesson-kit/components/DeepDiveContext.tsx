/**
 * Which lesson the reading view belongs to, so the deep layer can be fetched
 * on demand from inside the reader without threading props through every beat.
 */
import React, { createContext, useContext } from 'react';

interface DeepDiveTarget {
  stackId?: string;
  learningGoal?: string | null;
  marketId?: string;
}

const DeepDiveContext = createContext<DeepDiveTarget>({});

export function DeepDiveProvider({
  stackId,
  learningGoal,
  marketId,
  children,
}: DeepDiveTarget & { children: React.ReactNode }) {
  return (
    <DeepDiveContext.Provider value={{ stackId, learningGoal, marketId }}>{children}</DeepDiveContext.Provider>
  );
}

export function useDeepDiveTarget(): DeepDiveTarget {
  return useContext(DeepDiveContext);
}
