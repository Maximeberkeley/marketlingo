import re

def fix_lesson_screen():
    path = 'mobile/lesson-kit/screens/LessonScreen.tsx'
    with open(path, 'r') as f:
        lines = f.readlines()
    
    new_lines = []
    in_action = False
    for line in lines:
        # Remove duplicate setMaxIndexReached
        if 'setMaxIndexReached(prev => Math.max(prev, index + 1));' in line:
            if line not in new_lines:
                new_lines.append(line)
        else:
            new_lines.append(line)
            
    content = "".join(new_lines)
    
    # Fix the onAction logic to be clean
    pattern = r'if \(phase === \'answering\'\) \{[\s\S]*?setPhase\(\'feedback\'\);'
    replacement = """if (phase === 'answering') {
      if (!state.canCheck) return;
      if (index >= maxIndexReached) {
        setGradedCount(c => c + 1);
        if (state.isCorrect) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          playSound('correct').catch(() => {});
          setCorrectCount(c => c + 1);
          const nextCombo = combo + 1;
          setCombo(nextCombo);
          setBestCombo(previous => Math.max(previous, nextCombo));
          firePop(`+${xpPerCorrect} XP`);
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          playSound('wrong').catch(() => {});
          setCombo(0);
          setMissed(m => (exercise ? [...m, exercise] : m));
          const nextHearts = Math.max(0, hearts - 1);
          setHearts(nextHearts);
          if (nextHearts === 0) setShowHeartsPrompt(true);
        }
      }
      setPhase('feedback');"""
    
    content = re.sub(pattern, replacement, content)
    
    with open(path, 'w') as f:
        f.write(content)

fix_lesson_screen()
