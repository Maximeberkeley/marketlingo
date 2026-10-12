import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard } from "react-native";
import { tokens } from "../theme/tokens";
import { PrimaryButton } from "../components/PrimaryButton";
import { useDeliverable } from "../../hooks/useDeliverable";
import { trackEvent } from "../../lib/analytics";
function SayIt({ exercise, marketId, onDone, stackId }) {
  const dossier = useDeliverable(marketId, exercise.learningGoal);
  const { template, firstOpenSection, loading } = dossier;
  const [sectionKey, setSectionKey] = useState(null);
  const [picking, setPicking] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!sectionKey && !loading) {
      const matched = template.sections.find((s) => s.key === exercise.sectionKey);
      setSectionKey((matched ?? firstOpenSection ?? template.sections[0]).key);
    }
  }, [sectionKey, loading, firstOpenSection, template.sections, exercise.sectionKey]);
  const section = template.sections.find((s) => s.key === sectionKey) ?? template.sections[0];
  const shownRef = React.useRef(false);
  useEffect(() => {
    if (shownRef.current || !sectionKey) return;
    shownRef.current = true;
    trackEvent("say_it_shown", { stackId: stackId ?? null, sectionKey });
  }, [sectionKey, stackId]);
  const skip = () => {
    trackEvent("say_it_skipped", { stackId: stackId ?? null, sectionKey: section?.key ?? null });
    onDone();
  };
  const canAdd = text.trim().length >= 3 && !saving && !!marketId;
  const add = async () => {
    if (!canAdd) return;
    Keyboard.dismiss();
    setSaving(true);
    setFailed(false);
    const ok = await dossier.addLine(section.key, text, exercise.dayNumber, "learner");
    setSaving(false);
    if (ok) {
      setSaved(text.trim());
      trackEvent("say_it_saved", { stackId: stackId ?? null, sectionKey: section.key });
    } else setFailed(true);
  };
  if (saved) {
    return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(Text, { style: styles.eyebrow }, "ADDED TO ", template.title.toUpperCase(), " \xB7 ", section.title.toUpperCase()), /* @__PURE__ */ React.createElement(View, { style: styles.mine }, /* @__PURE__ */ React.createElement(Text, { style: styles.mineText }, saved)), !!exercise.takeaway?.trim() && /* @__PURE__ */ React.createElement(View, { style: styles.compare }, /* @__PURE__ */ React.createElement(Text, { style: styles.compareLabel }, "Compare with the lesson"), /* @__PURE__ */ React.createElement(Text, { style: styles.compareText }, exercise.takeaway.trim())), /* @__PURE__ */ React.createElement(PrimaryButton, { label: "Continue", onPress: onDone }));
  }
  return /* @__PURE__ */ React.createElement(View, { style: styles.wrap }, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, "Say it in one sentence"), /* @__PURE__ */ React.createElement(Text, { style: styles.prompt }, section.prompt), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: () => setPicking((p) => !p), style: styles.sectionChip, accessibilityRole: "button" }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionChipText, numberOfLines: 1 }, template.title, " \xB7 ", section.title), /* @__PURE__ */ React.createElement(Text, { style: styles.sectionChipAction }, picking ? "Close" : "Change")), picking && /* @__PURE__ */ React.createElement(View, { style: styles.list }, template.sections.map((s) => {
    const written = (dossier.bySection[s.key]?.length ?? 0) > 0;
    const active = s.key === section.key;
    return /* @__PURE__ */ React.createElement(
      TouchableOpacity,
      {
        key: s.key,
        style: [styles.listItem, active && styles.listItemActive],
        onPress: () => {
          setSectionKey(s.key);
          setPicking(false);
        }
      },
      /* @__PURE__ */ React.createElement(Text, { style: [styles.listText, active && styles.listTextActive] }, s.title),
      written && /* @__PURE__ */ React.createElement(Text, { style: styles.listMeta }, "written")
    );
  })), /* @__PURE__ */ React.createElement(
    TextInput,
    {
      style: styles.input,
      value: text,
      onChangeText: setText,
      placeholder: "Write it the way you would say it out loud\u2026",
      placeholderTextColor: tokens.color.textMuted,
      multiline: true,
      maxLength: 280,
      blurOnSubmit: true
    }
  ), failed && /* @__PURE__ */ React.createElement(Text, { style: styles.error }, "Couldn't save that. Try again, or skip for now."), /* @__PURE__ */ React.createElement(
    PrimaryButton,
    {
      label: saving ? "Saving\u2026" : `Add to my ${template.title}`,
      onPress: add,
      variant: canAdd ? "primary" : "disabled"
    }
  ), /* @__PURE__ */ React.createElement(TouchableOpacity, { onPress: skip, style: styles.skip, hitSlop: 10, accessibilityRole: "link", disabled: saving }, /* @__PURE__ */ React.createElement(Text, { style: styles.skipText }, "Skip")));
}
const styles = StyleSheet.create({
  wrap: { gap: tokens.space.md },
  title: { fontSize: tokens.font.prompt, fontWeight: "800", color: tokens.color.text },
  prompt: { fontSize: tokens.font.body, color: tokens.color.textSecondary, lineHeight: 22 },
  eyebrow: { fontSize: tokens.font.caption, fontWeight: "800", color: tokens.color.accent, letterSpacing: 0.6 },
  sectionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.accentSoft
  },
  sectionChipText: { flex: 1, fontSize: tokens.font.caption + 1, fontWeight: "700", color: tokens.color.text },
  sectionChipAction: { fontSize: tokens.font.caption, fontWeight: "800", color: tokens.color.accent },
  list: { gap: 6 },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: tokens.space.md,
    paddingVertical: 10,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.card
  },
  listItemActive: { borderColor: tokens.color.accent },
  listText: { flex: 1, fontSize: tokens.font.caption + 1, color: tokens.color.text },
  listTextActive: { fontWeight: "800" },
  listMeta: { fontSize: tokens.font.caption, color: tokens.color.textMuted },
  input: {
    minHeight: 96,
    borderRadius: tokens.radius.md,
    borderWidth: 2,
    borderColor: tokens.color.border,
    backgroundColor: tokens.color.card,
    padding: tokens.space.md,
    fontSize: tokens.font.body,
    color: tokens.color.text,
    textAlignVertical: "top"
  },
  error: { fontSize: tokens.font.caption, color: tokens.color.incorrect },
  skip: { alignSelf: "center", paddingVertical: 4 },
  skipText: { fontSize: tokens.font.caption, color: tokens.color.textSecondary },
  mine: {
    paddingHorizontal: tokens.space.md,
    backgroundColor: tokens.color.accentSoft,
    paddingVertical: 4
  },
  mineText: { fontSize: tokens.font.body, color: tokens.color.text, lineHeight: 24, fontWeight: "600" },
  compare: {
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    padding: tokens.space.md,
    gap: 4
  },
  compareLabel: { fontSize: tokens.font.caption, fontWeight: "800", color: tokens.color.textSecondary },
  compareText: { fontSize: tokens.font.body, color: tokens.color.text, lineHeight: 22 }
});
export {
  SayIt
};
