import React from "react";
import { InfoCard } from "../exercises/InfoCard";
import { MultipleChoice } from "../exercises/MultipleChoice";
import { WordBank } from "../exercises/WordBank";
import { ColdOpen } from "../modules/ColdOpen";
import { MicroInsight } from "../modules/MicroInsight";
import { SortSignal } from "../modules/SortSignal";
import { BuildChain } from "../modules/BuildChain";
import { FaceOff } from "../modules/FaceOff";
import { SpeedRound } from "../modules/SpeedRound";
import { NumberSense } from "../modules/NumberSense";
import { SpotTheFake } from "../modules/SpotTheFake";
import { MapMarket } from "../modules/MapMarket";
import { ChartRead } from "../modules/ChartRead";
import { TheCall } from "../modules/TheCall";
import { MatchPairs } from "../modules/MatchPairs";
import { QuickFire } from "../modules/QuickFire";
const PASSIVE_KINDS = ["info", "coldOpen", "microInsight"];
const isPassiveKind = (kind) => PASSIVE_KINDS.includes(kind);
function renderExerciseByKind(exercise, phase, onChange) {
  switch (exercise.kind) {
    case "info":
      return /* @__PURE__ */ React.createElement(InfoCard, { exercise, phase, onChange });
    case "multipleChoice":
      return /* @__PURE__ */ React.createElement(MultipleChoice, { exercise, phase, onChange });
    case "wordBank":
      return /* @__PURE__ */ React.createElement(WordBank, { exercise, phase, onChange });
    case "coldOpen":
      return /* @__PURE__ */ React.createElement(ColdOpen, { exercise, phase, onChange });
    case "microInsight":
      return /* @__PURE__ */ React.createElement(MicroInsight, { exercise, phase, onChange });
    case "sortSignal":
      return /* @__PURE__ */ React.createElement(SortSignal, { exercise, phase, onChange });
    case "buildChain":
      return /* @__PURE__ */ React.createElement(BuildChain, { exercise, phase, onChange });
    case "faceOff":
      return /* @__PURE__ */ React.createElement(FaceOff, { exercise, phase, onChange });
    case "speedRound":
      return /* @__PURE__ */ React.createElement(SpeedRound, { exercise, phase, onChange });
    case "numberSense":
      return /* @__PURE__ */ React.createElement(NumberSense, { exercise, phase, onChange });
    case "spotFake":
      return /* @__PURE__ */ React.createElement(SpotTheFake, { exercise, phase, onChange });
    case "mapMarket":
      return /* @__PURE__ */ React.createElement(MapMarket, { exercise, phase, onChange });
    case "chartRead":
      return /* @__PURE__ */ React.createElement(ChartRead, { exercise, phase, onChange });
    case "theCall":
      return /* @__PURE__ */ React.createElement(TheCall, { exercise, phase, onChange });
    case "matchPairs":
      return /* @__PURE__ */ React.createElement(MatchPairs, { exercise, phase, onChange });
    case "quickFire":
      return /* @__PURE__ */ React.createElement(QuickFire, { exercise, phase, onChange });
    default:
      return null;
  }
}
export {
  PASSIVE_KINDS,
  isPassiveKind,
  renderExerciseByKind
};
