import React from 'react';
import { router } from 'expo-router';
import { DemoLesson } from '../components/demo/DemoLesson';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../lib/storage';
import { supabase } from '../lib/supabase';

export default function DemoScreen() {
  const { user } = useAuth();

  const continueToNextStep = async (status: 'completed' | 'skipped') => {
    await storage.setDemoStatus(status);
    if (user) {
      await supabase.from('profiles').update({ demo_onboarding_status: status }).eq('id', user.id);
      router.replace('/onboarding' as any);
      return;
    }
    router.replace({ pathname: '/auth', params: { mode: 'signup' } } as any);
  };

  return (
    <DemoLesson
      onComplete={() => void continueToNextStep('completed')}
      onSkip={() => void continueToNextStep('skipped')}
    />
  );
}