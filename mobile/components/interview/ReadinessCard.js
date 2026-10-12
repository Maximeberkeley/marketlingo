import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants";
import { buildSprintPlan, daysUntil, weekKey } from "../../lib/interviewPrep";
import { InterviewTargetForm } from "./InterviewTargetForm";
import { triggerHaptic } from "../../lib/haptics";
function ReadinessCard({ visible, inline = false, readiness, onClose, onStartMock, onOpenBrief }) {
  const rise = useRef(new Animated.Value(0)).current;
  const [answered, setAnswered] = useState({});
  useEffect(() => {
    if (!visible) return;
    rise.setValue(0);
    Animated.spring(rise, { toValue: 1, tension: 70, friction: 11, useNativeDriver: true }).start();
  }, [visible]);
  const { target, percent, parts, concepts, news } = readiness;
  const days = daysUntil(target?.date);
  const sprint = useMemo(
    () => target && days != null && days >= 0 && days < 14 ? buildSprintPlan({ target, daysLeft: days, concepts, news }) : null,
    [target?.updatedAt, days, concepts.join("|"), news.join("|")]
  );
  const weekly = target && !target.date;
  const translateY = rise.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });
  const body = <>
            <Text style={styles.eyebrow}>INTERVIEW READINESS</Text>
            <View style={styles.scoreRow}>
              <Text style={styles.score}>{percent}%</Text>
              {target ? <Text style={styles.scoreSub}>{`${target.role}
${target.company}${days != null && days >= 0 ? ` \xB7 ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}` : ""}`}</Text> : null}
            </View>
            <View style={styles.bar}><View style={[styles.barFill, { width: `${Math.max(3, percent)}%` }]} /></View>

            {parts.map((p) => <View key={p.key} style={styles.part}>
                <View style={[styles.dot, { opacity: 0.3 + p.ratio * 0.7 }]} />
                <Text style={styles.partLabel}>{p.label}</Text>
                <Text style={styles.partDetail}>{p.detail}</Text>
              </View>)}

            {!target && <View style={{ marginTop: 14 }}>
                <InterviewTargetForm target={null} onSave={readiness.saveTarget} />
              </View>}

            {sprint && <View style={{ marginTop: 18 }}>
                <Text style={styles.section}>{`SPRINT \xB7 ${sprint.length} DAY${sprint.length === 1 ? "" : "S"}`}</Text>
                {sprint.map((d, i) => <View key={d.day} style={[styles.day, i === 0 && styles.dayToday]}>
                    <Text style={styles.dayHead}>{i === 0 ? `Today \xB7 ${d.dateLabel}` : `Day ${d.day} \xB7 ${d.dateLabel}`}</Text>
                    {d.fullMock ? <Text style={styles.dayLine}><Text style={styles.dayKey}>Full mock  </Text>{d.mock}</Text> : <>
                        <Text style={styles.dayLine}><Text style={styles.dayKey}>Concept  </Text>{d.concept}</Text>
                        <Text style={styles.dayLine}><Text style={styles.dayKey}>Mock  </Text>{d.mock}</Text>
                        {d.news && <>
                            <Text style={styles.dayLine}><Text style={styles.dayKey}>News  </Text>{d.news.title}</Text>
                            <Text style={styles.howTo}>How to mention this in your interview: {d.news.howToMention}</Text>
                            {i === 0 && <TouchableOpacity
    disabled={answered[d.news.title]}
    onPress={() => {
      triggerHaptic("success");
      setAnswered((a) => ({ ...a, [d.news.title]: true }));
      void readiness.markCurrentEvent(d.news.title);
    }}
    style={styles.chip}
  >
                                <Text style={styles.chipText}>{answered[d.news.title] ? "Practised" : "I practised mentioning it"}</Text>
                              </TouchableOpacity>}
                          </>}
                      </>}
                    {i === 0 && <TouchableOpacity onPress={onStartMock} style={styles.primary}><Text style={styles.primaryText}>{d.fullMock ? "Start full mock" : "Answer today\u2019s mock"}</Text></TouchableOpacity>}
                  </View>)}
              </View>}

            {weekly && <View style={{ marginTop: 18 }}>
                <Text style={styles.section}>{`STAY READY \xB7 WEEK OF ${weekKey()}`}</Text>
                <View style={[styles.day, styles.dayToday]}>
                  <Text style={styles.dayLine}><Text style={styles.dayKey}>1  </Text>Answer one mock question.</Text>
                  <Text style={styles.dayLine}><Text style={styles.dayKey}>2  </Text>Update one line of your Interview Brief.</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                    <TouchableOpacity onPress={onStartMock} style={[styles.primary, { flex: 1, marginTop: 0 }]}><Text style={styles.primaryText}>Mock question</Text></TouchableOpacity>
                    <TouchableOpacity onPress={onOpenBrief} style={[styles.secondary, { flex: 1 }]}><Text style={styles.secondaryText}>Update Brief</Text></TouchableOpacity>
                  </View>
                </View>
              </View>}

            {target && !sprint && !weekly && <TouchableOpacity onPress={onStartMock} style={styles.primary}><Text style={styles.primaryText}>Start a mock</Text></TouchableOpacity>}
          </>;
  if (inline) {
    return <View style={[styles.glass, styles.inline]}>
        <View style={styles.sheen} pointerEvents="none" />
        {body}
      </View>;
  }
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.glass, { opacity: rise, transform: [{ translateY }] }]}>
          <View style={styles.sheen} pointerEvents="none" />
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.close} accessibilityLabel="Close">
            <Feather name="x" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 6 }}>
            {body}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>;
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(15,12,30,0.35)", justifyContent: "center", padding: 18 },
  glass: {
    maxHeight: "86%",
    borderRadius: 28,
    padding: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.86)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
    shadowColor: "#1A1033",
    shadowOpacity: 0.22,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 14
  },
  inline: { maxHeight: void 0, elevation: 3, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, borderColor: COLORS.border },
  sheen: { position: "absolute", top: -60, left: -40, right: -40, height: 140, backgroundColor: "rgba(139,92,246,0.08)", borderRadius: 140 },
  close: { position: "absolute", right: 16, top: 16, zIndex: 2 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.4, color: COLORS.accent },
  scoreRow: { flexDirection: "row", alignItems: "flex-end", gap: 14, marginTop: 6 },
  score: { fontSize: 52, lineHeight: 56, fontWeight: "900", color: COLORS.textPrimary, letterSpacing: -1.5 },
  scoreSub: { flex: 1, fontSize: 13, lineHeight: 18, color: COLORS.textSecondary, marginBottom: 8, fontWeight: "600" },
  bar: { height: 6, borderRadius: 3, backgroundColor: "rgba(139,92,246,0.14)", marginTop: 12, marginBottom: 14, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  part: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: COLORS.border },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  partLabel: { flex: 1, fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  partDetail: { fontSize: 13, color: COLORS.textSecondary },
  section: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2, color: COLORS.textMuted, marginBottom: 8 },
  day: { borderRadius: 16, padding: 14, marginBottom: 8, backgroundColor: "rgba(255,255,255,0.6)", borderWidth: 1, borderColor: COLORS.border, gap: 4 },
  dayToday: { borderColor: COLORS.accentMedium, backgroundColor: "rgba(139,92,246,0.06)" },
  dayHead: { fontSize: 12, fontWeight: "800", color: COLORS.textMuted, marginBottom: 2 },
  dayLine: { fontSize: 14, lineHeight: 20, color: COLORS.textPrimary },
  dayKey: { fontWeight: "800", color: COLORS.accent },
  howTo: { fontSize: 13, lineHeight: 18, color: COLORS.textSecondary, fontStyle: "italic" },
  chip: { alignSelf: "flex-start", marginTop: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: COLORS.accentSoft },
  chipText: { fontSize: 12, fontWeight: "800", color: COLORS.accentDark },
  primary: { marginTop: 10, backgroundColor: COLORS.accent, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  primaryText: { color: COLORS.textOnAccent, fontWeight: "800", fontSize: 15 },
  secondary: { borderRadius: 14, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: COLORS.accentMedium },
  secondaryText: { color: COLORS.accent, fontWeight: "800", fontSize: 15 }
});
export {
  ReadinessCard
};
