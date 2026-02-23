import { useState, useCallback, useRef } from "react";

export type MilestoneType = "streak" | "level_up" | "passport_stamp" | "stage_up";

interface MilestoneData {
  value: number;
  label: string;
  marketName?: string;
  marketEmoji?: string;
  stageName?: string;
  monthName?: string;
  grade?: string;
}

interface MilestoneState {
  visible: boolean;
  type: MilestoneType;
  data: MilestoneData;
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180];
const LEVEL_MILESTONES = [5, 10, 15, 20, 25, 30, 50];

export function useMilestoneSharing() {
  const [milestone, setMilestone] = useState<MilestoneState>({
    visible: false,
    type: "streak",
    data: { value: 0, label: "" },
  });

  const shownRef = useRef<Set<string>>(new Set());

  const showMilestone = useCallback((type: MilestoneType, data: MilestoneData) => {
    const key = `${type}_${data.value}`;
    if (shownRef.current.has(key)) return;
    shownRef.current.add(key);
    setMilestone({ visible: true, type, data });
  }, []);

  const dismissMilestone = useCallback(() => {
    setMilestone((prev) => ({ ...prev, visible: false }));
  }, []);

  const checkStreakMilestone = useCallback(
    (streak: number, marketName?: string, marketEmoji?: string) => {
      if (STREAK_MILESTONES.includes(streak)) {
        showMilestone("streak", { value: streak, label: `${streak} days in a row`, marketName, marketEmoji });
      }
    },
    [showMilestone]
  );

  const checkLevelMilestone = useCallback(
    (level: number, marketName?: string, marketEmoji?: string) => {
      if (LEVEL_MILESTONES.includes(level)) {
        showMilestone("level_up", { value: level, label: `Level ${level} unlocked`, marketName, marketEmoji });
      }
    },
    [showMilestone]
  );

  const showPassportStamp = useCallback(
    (monthName: string, grade: string, marketName?: string, marketEmoji?: string) => {
      showMilestone("passport_stamp", { value: 0, label: `${grade} — ${monthName}`, monthName, grade, marketName, marketEmoji });
    },
    [showMilestone]
  );

  const showStageUp = useCallback(
    (stageName: string, stageNumber: number, marketName?: string, marketEmoji?: string) => {
      showMilestone("stage_up", { value: stageNumber, label: `Stage ${stageNumber}: ${stageName}`, stageName, marketName, marketEmoji });
    },
    [showMilestone]
  );

  return { milestone, dismissMilestone, checkStreakMilestone, checkLevelMilestone, showPassportStamp, showStageUp };
}
