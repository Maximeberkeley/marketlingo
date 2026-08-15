/**
 * useAIConsent — consent state + a gate helper for AI/voice surfaces.
 *
 * Usage:
 *   const { consent, requireAI, requireVoice, modalProps } = useAIConsent();
 *   if (!(await requireAI())) return;  // shows the disclosure sheet
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ConsentState,
  emptyConsent,
  loadConsent,
  grantAIConsent,
  declineAIConsent,
  grantVoiceConsent,
  revokeAIConsent,
  revokeVoiceConsent,
} from '../lib/aiConsent';
import { trackEvent } from '../lib/analytics';

export type ConsentKind = 'ai' | 'voice';

export function useAIConsent() {
  const [consent, setConsent] = useState<ConsentState>(emptyConsent);
  const [pendingKind, setPendingKind] = useState<ConsentKind | null>(null);
  const resolverRef = useRef<((ok: boolean) => void) | null>(null);

  const refresh = useCallback(async () => {
    const state = await loadConsent();
    setConsent(state);
    return state;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const request = useCallback(
    (kind: ConsentKind) =>
      new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
        setPendingKind(kind);
        trackEvent('ai_consent_prompted', { kind });
      }),
    [],
  );

  const requireAI = useCallback(async () => {
    const state = consent.loaded ? consent : await refresh();
    if (state.ai) return true;
    return request('ai');
  }, [consent, refresh, request]);

  const requireVoice = useCallback(async () => {
    const state = consent.loaded ? consent : await refresh();
    if (state.voice) return true;
    return request('voice');
  }, [consent, refresh, request]);

  const accept = useCallback(async () => {
    const kind = pendingKind;
    if (kind === 'voice') await grantVoiceConsent();
    else await grantAIConsent();
    trackEvent('ai_consent_accepted', { kind: kind || 'ai' });
    setPendingKind(null);
    await refresh();
    resolverRef.current?.(true);
    resolverRef.current = null;
  }, [pendingKind, refresh]);

  const decline = useCallback(async () => {
    const kind = pendingKind;
    if (kind === 'ai') await declineAIConsent();
    trackEvent('ai_consent_declined', { kind: kind || 'ai' });
    setPendingKind(null);
    await refresh();
    resolverRef.current?.(false);
    resolverRef.current = null;
  }, [pendingKind, refresh]);

  const setAI = useCallback(
    async (value: boolean) => {
      if (value) await grantAIConsent();
      else await revokeAIConsent();
      await refresh();
    },
    [refresh],
  );

  const setVoice = useCallback(
    async (value: boolean) => {
      if (value) await grantVoiceConsent();
      else await revokeVoiceConsent();
      await refresh();
    },
    [refresh],
  );

  return {
    consent,
    refresh,
    requireAI,
    requireVoice,
    setAI,
    setVoice,
    modalProps: {
      visible: pendingKind !== null,
      kind: (pendingKind || 'ai') as ConsentKind,
      onAccept: accept,
      onDecline: decline,
    },
  };
}
