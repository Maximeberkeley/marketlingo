import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import {
  LessonPrerequisite,
  PrerequisiteActivity,
} from '../components/course/LessonPrerequisite';

const ACTIVITIES: PrerequisiteActivity[] = ['arena', 'case', 'intel', 'notes'];

export default function LessonPrerequisiteRoute() {
  const params = useLocalSearchParams<{ activity?: string; stackId?: string }>();
  const activity = ACTIVITIES.includes(params.activity as PrerequisiteActivity)
    ? params.activity as PrerequisiteActivity
    : 'case';

  return <LessonPrerequisite activity={activity} lessonStackId={params.stackId} />;
}