import { useNavigate } from "react-router-dom";
import { LessonExperience, Lesson } from "@/components/lesson3d/LessonExperience";

const SAMPLE_LESSON: Lesson = {
  title: "Why chip fabs run at 100% or die",
  dayNumber: 3,
  steps: [
    {
      kind: "recall",
      prompt: "What does a fab sell when demand drops?",
      answer: "Capacity — the machines run whether orders come in or not.",
    },
    {
      kind: "discover",
      headline: "Fixed costs set the whole game",
      line: "A fab costs billions before it makes one chip. Every idle hour burns the same money as a busy one.",
      terms: ["Fixed cost", "Utilization", "Capex"],
    },
    {
      kind: "predict",
      prompt: "Orders fall 20%. What happens to cost per chip?",
      options: [
        { label: "It jumps", detail: "Same fixed cost spread over fewer chips.", correct: true, consequence: "Right. Fixed cost per unit rises fast — margins collapse before revenue does." },
        { label: "It stays flat", detail: "Costs scale with volume.", correct: false, consequence: "Not here. Only materials scale; the plant, tools and staff do not." },
      ],
    },
    {
      kind: "apply",
      prompt: "A rival cuts prices 15% during a slump. Your fab is 70% full. Your move?",
      options: [
        { label: "Match the price", detail: "Keep the lines loaded.", correct: true, consequence: "Loaded lines beat high prices in this industry — utilization is the margin." },
        { label: "Hold price", detail: "Protect the margin per chip.", correct: false, consequence: "You protect the sticker and lose the volume that pays for the plant." },
        { label: "Idle a line", detail: "Cut output to fit demand.", correct: false, consequence: "Restart costs and lost qualification make this the most expensive option." },
      ],
    },
    {
      kind: "decide",
      prompt: "Board call: commit $12B to a new fab now, in the middle of a downturn?",
      options: [
        { label: "Commit now", detail: "Capacity lands in 3 years, right as the cycle turns.", correct: true, consequence: "The winners in this industry build counter-cyclically. You ship when rivals are still pouring concrete." },
        { label: "Wait for recovery", detail: "Safer on cash this year.", correct: false, consequence: "You break ground at the peak and open into the next glut. Classic cycle trap." },
      ],
    },
    {
      kind: "debrief",
      decision: "You built into the downturn",
      reuseLine: "In capital-heavy industries, ask 'what is utilization?' before you ask 'what is the price?'",
      next: "Day 4 · Who controls the tools",
    },
  ],
};

export default function LessonLab() {
  const navigate = useNavigate();
  return <LessonExperience lesson={SAMPLE_LESSON} onExit={() => navigate("/home")} />;
}
