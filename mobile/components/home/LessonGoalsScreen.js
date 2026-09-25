import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../../lib/constants";
import { getMarketWorld } from "../../data/marketWorlds";
import { getMarketName } from "../../lib/markets";
import { SpeechBubble } from "../ui/SpeechBubble";
import { lessonGoalLabels } from "../../lib/lessonGoals";
function LessonGoalsScreen({ title, slides, objectives, marketId, day = 1, isBite, onStart, onBack }) {
  const insets = useSafeAreaInsets();
  const world = getMarketWorld(marketId);
  const marketName = getMarketName(marketId || "aerospace");
  const goals = useMemo(() => lessonGoalLabels(objectives, slides), [objectives, slides]);
  const safeGoals = goals.length ? goals : ["Read the signal", "Make the call", "Keep the insight"];
  return <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 18 }]}>
      <TouchableOpacity onPress={onBack} style={styles.back} accessibilityLabel="Back to home">
        <Feather name="x" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <LinearGradient colors={[world.colors[0], world.colors[1]]} style={styles.hero}>
        <Image source={world.illustration} style={styles.illustration} />
        <Text style={styles.kicker}>{isBite ? "QUICK BITE" : `DAY ${day}`}</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.timeChip}>
          <Feather name="clock" size={14} color={COLORS.bg0} />
          <Text style={styles.timeText}>{marketName} · {isBite ? "1 min" : "6 min"}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>{goals.length ? "In this lesson" : "Your next lesson"}</Text>
        <View style={styles.goals}>
          {safeGoals.map((goal, index) => <View key={`${goal}-${index}`} style={styles.goalRow}>
              <View style={[styles.number, { backgroundColor: world.colors[index % world.colors.length] }]}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              <Text style={styles.goalText}>{goal}</Text>
            </View>)}
        </View>

        <View style={styles.leoRow}>
          <Image source={require("../../assets/mascot/leo-reference.png")} style={styles.leo} />
          <SpeechBubble text="Three sharp moves. Then you make the call." tail="left" compact style={styles.leoBalloon} textStyle={styles.leoLine} />
        </View>
      </ScrollView>

      <TouchableOpacity style={[styles.start, { backgroundColor: world.colors[0], shadowColor: world.colors[0] }]} onPress={onStart} activeOpacity={0.86}>
        <Text style={styles.startText}>Start mission</Text>
        <Feather name="arrow-right" size={19} color={COLORS.bg0} />
      </TouchableOpacity>
    </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg0, paddingHorizontal: 16 },
  back: { width: 42, height: 42, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  hero: { minHeight: 206, borderRadius: 22, padding: 22, justifyContent: "flex-end", overflow: "hidden" },
  illustration: { position: "absolute", width: 174, height: 174, right: -14, top: -6, resizeMode: "contain", opacity: 0.88 },
  kicker: { color: COLORS.bg0, fontSize: 11, fontWeight: "900", letterSpacing: 1.2, opacity: 0.82 },
  title: { color: COLORS.bg0, fontSize: 29, lineHeight: 34, fontWeight: "700", maxWidth: "76%", marginTop: 7 },
  timeChip: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  timeText: { color: COLORS.bg0, fontSize: 13, fontWeight: "700" },
  body: { flex: 1 },
  bodyContent: { paddingTop: 18, paddingBottom: 14 },
  heading: { fontSize: 19, fontWeight: "800", color: COLORS.textPrimary },
  subheading: { marginTop: 4, fontSize: 15, color: COLORS.textSecondary },
  goals: { gap: 8, marginTop: 12 },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 11, minHeight: 42 },
  number: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  numberText: { color: COLORS.bg0, fontSize: 14, fontWeight: "900" },
  goalText: { flex: 1, fontSize: 15, lineHeight: 20, color: COLORS.textPrimary, fontWeight: "700" },
  leoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  leo: { width: 44, height: 44, resizeMode: "contain" },
  leoBalloon: { flex: 1 },
  leoLine: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  start: { height: 56, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.34, shadowRadius: 16, elevation: 10 },
  startText: { color: COLORS.bg0, fontSize: 17, fontWeight: "900" }
});
export {
  LessonGoalsScreen
};
