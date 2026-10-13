import React, { createContext, useContext } from "react";
const DeepDiveContext = createContext({});
function DeepDiveProvider({
  stackId,
  learningGoal,
  marketId,
  children
}) {
  return /* @__PURE__ */ React.createElement(DeepDiveContext.Provider, { value: { stackId, learningGoal, marketId } }, children);
}
function useDeepDiveTarget() {
  return useContext(DeepDiveContext);
}
export {
  DeepDiveProvider,
  useDeepDiveTarget
};
