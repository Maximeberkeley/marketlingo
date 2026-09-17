import re
import os

def update_lesson_screen():
    path = 'mobile/lesson-kit/screens/LessonScreen.tsx'
    with open(path, 'r') as f:
        content = f.read()

    # 1. Add maxIndexReached state
    if 'maxIndexReached' not in content:
        content = content.replace(
            'const [index, setIndex] = useState(0);',
            'const [index, setIndex] = useState(0);\n  const [maxIndexReached, setMaxIndexReached] = useState(0);'
        )

    # 2. Add handleBack function
    if 'const handleBack' not in content:
        handle_back_code = """  const handleBack = useCallback(() => {
    if (index > 0) {
      setIndex(i => i - 1);
      setPhase('answering');
      setState({ canCheck: true, isCorrect: true });
    }
  }, [index]);\n\n"""
        content = content.replace('const goNext = useCallback(() => {', handle_back_code + '  const goNext = useCallback(() => {')

    # 3. Update goNext to maintain maxIndexReached
    content = content.replace(
        'setIndex(i => i + 1);',
        'setIndex(i => i + 1);\n    setMaxIndexReached(prev => Math.max(prev, index + 1));'
    )

    # 4. Prevent double scoring in onAction
    # Find the grading block in onAction
    grading_pattern = r'(if\s*\(phase\s*===\s*\'answering\'\)\s*\{)([\s\S]*?)(setPhase\(\'feedback\'\);)'
    
    def prevent_double_scoring(match):
        start = match.group(1)
        body = match.group(2)
        end = match.group(3)
        # Wrap the scoring logic in a check
        new_body = f"\n      if (index >= maxIndexReached) {{\n{body}      }}\n      "
        return start + new_body + end

    content = re.sub(grading_pattern, prevent_double_scoring, content)

    with open(path, 'w') as f:
        f.write(content)

def update_leo_coach():
    path = 'mobile/lesson-kit/components/LeoCoach.tsx'
    with open(path, 'r') as f:
        content = f.read()

    # Remove fixed height from scene, use minHeight
    content = content.replace('height: SCENE_H,', 'minHeight: SCENE_H,')
    
    # Remove width: 124 from leo
    content = content.replace('width: 124,', '')
    
    # Add a bit of space to prevent clipping
    content = content.replace('marginBottom: -8,', 'marginBottom: -4,')

    with open(path, 'w') as f:
        f.write(content)

def update_leo_character():
    path = 'mobile/components/mascot/LeoCharacter.tsx'
    with open(path, 'r') as f:
        content = f.read()

    # Ensure resizeMode="contain" is robust and container doesn't force stretching
    # Actually it looks okay, but let's make sure the Image isn't being stretched by its container's flex
    content = content.replace("resizeMode: 'contain'", "resizeMode: 'contain', alignSelf: 'center'")

    with open(path, 'w') as f:
        f.write(content)

if __name__ == "__main__":
    update_lesson_screen()
    update_leo_coach()
    update_leo_character()
