import React from "react";
import { Redirect } from "expo-router";
function LeaderboardRedirect() {
  return /* @__PURE__ */ React.createElement(Redirect, { href: "/friends" });
}
export {
  LeaderboardRedirect as default
};
