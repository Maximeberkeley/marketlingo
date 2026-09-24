import { useState, useCallback, useRef } from 'react';
const STREAK_MILESTONES = [3, 7, 14, 30, 60, 90, 180];
const LEVEL_MILESTONES = [5, 10, 15, 20, 25, 30, 50];
export function useMilestoneSharing() {
    const [milestone, setMilestone] = useState({
        visible: false,
        type: 'streak',
        data: { value: 0, label: '' },
    });
    // Track shown milestones per session to avoid repeats
    const shownRef = useRef(new Set());
    const showMilestone = useCallback((type, data) => {
        const key = `${type}_${data.value}`;
        if (shownRef.current.has(key))
            return;
        shownRef.current.add(key);
        setMilestone({ visible: true, type, data });
    }, []);
    const dismissMilestone = useCallback(() => {
        setMilestone((prev) => ({ ...prev, visible: false }));
    }, []);
    const checkStreakMilestone = useCallback((streak, marketName, marketEmoji) => {
        if (STREAK_MILESTONES.includes(streak)) {
            showMilestone('streak', {
                value: streak,
                label: `${streak} days in a row`,
                marketName,
                marketEmoji,
            });
        }
    }, [showMilestone]);
    const checkLevelMilestone = useCallback((level, marketName, marketEmoji) => {
        if (LEVEL_MILESTONES.includes(level)) {
            showMilestone('level_up', {
                value: level,
                label: `Level ${level} unlocked`,
                marketName,
                marketEmoji,
            });
        }
    }, [showMilestone]);
    const showPassportStamp = useCallback((monthName, grade, marketName, marketEmoji) => {
        showMilestone('passport_stamp', {
            value: 0,
            label: `${grade} — ${monthName}`,
            monthName,
            grade,
            marketName,
            marketEmoji,
        });
    }, [showMilestone]);
    const showStageUp = useCallback((stageName, stageNumber, marketName, marketEmoji) => {
        showMilestone('stage_up', {
            value: stageNumber,
            label: `Stage ${stageNumber}: ${stageName}`,
            stageName,
            marketName,
            marketEmoji,
        });
    }, [showMilestone]);
    return {
        milestone,
        dismissMilestone,
        checkStreakMilestone,
        checkLevelMilestone,
        showPassportStamp,
        showStageUp,
    };
}
