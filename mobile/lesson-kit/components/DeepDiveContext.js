/**
 * Which lesson the reading view belongs to, so the deep layer can be fetched
 * on demand from inside the reader without threading props through every beat.
 */
import React, { createContext, useContext } from 'react';
const DeepDiveContext = createContext({});
export function DeepDiveProvider({ stackId, learningGoal, children, }) {
    return (<DeepDiveContext.Provider value={{ stackId, learningGoal }}>{children}</DeepDiveContext.Provider>);
}
export function useDeepDiveTarget() {
    return useContext(DeepDiveContext);
}
