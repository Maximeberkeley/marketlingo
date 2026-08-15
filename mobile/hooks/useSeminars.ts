import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface Seminar {
  id: string;
  market_id: string;
  title: string;
  description: string | null;
  speaker_name: string | null;
  speaker_title: string | null;
  speaker_avatar_url: string | null;
  video_url: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  prep_start_at: string | null;
  post_content_at: string | null;
  key_takeaways: { text: string }[];
  mini_case: string | null;
  tags: string[];
  is_pro_only: boolean;
  created_at: string;
}

export type PrepModuleType = 'concept_quiz' | 'flashcards' | 'scenario' | 'reflection';

export interface PrepModule {
  id: string;
  seminar_id: string;
  title: string;
  content: string | null;
  quiz_question: string | null;
  quiz_options: string[];
  correct_index: number | null;
  sort_order: number;
  xp_reward: number;
  module_type: PrepModuleType;
  key_takeaways: string[];
  reflection_prompt: string | null;
  scenario_brief: string | null;
  flashcards: { front: string; back: string }[];
  estimated_minutes: number;
}

export interface Registration {
  id: string;
  user_id: string;
  seminar_id: string;
  attended: boolean;
  prep_completed: boolean;
  prep_modules_done: number;
}

export interface ChatMessage {
  id: string;
  seminar_id: string;
  user_id: string;
  message: string;
  is_pinned: boolean;
  created_at: string;
  parent_id: string | null;
  like_count: number;
  reply_count: number;
  username?: string;
  avatar_url?: string;
  liked_by_me?: boolean;
}

export function useSeminars(marketId?: string) {
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSeminars = useCallback(async () => {
    if (!marketId) return;
    setLoading(true);
    const { data } = await supabase
      .from('seminars')
      .select('*')
      .eq('market_id', marketId)
      .order('scheduled_at', { ascending: true });
    setSeminars((data as any[] || []) as Seminar[]);
    setLoading(false);
  }, [marketId]);

  useEffect(() => { fetchSeminars(); }, [fetchSeminars]);

  return { seminars, loading, refetch: fetchSeminars };
}

export function useSeminarDetail(seminarId: string) {
  const { user } = useAuth();
  const [seminar, setSeminar] = useState<Seminar | null>(null);
  const [prepModules, setPrepModules] = useState<PrepModule[]>([]);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!seminarId || !user?.id) return;
    setLoading(true);

    const [semRes, prepRes, regRes] = await Promise.all([
      supabase.from('seminars').select('*').eq('id', seminarId).maybeSingle(),
      supabase.from('seminar_prep_modules').select('*').eq('seminar_id', seminarId).order('sort_order'),
      supabase.from('seminar_registrations').select('*').eq('seminar_id', seminarId).eq('user_id', user.id).maybeSingle(),
    ]);

    if (semRes.data) setSeminar(semRes.data as any);
    setPrepModules(((prepRes.data as any[]) || []).map((m: any) => ({
      ...m,
      module_type: m.module_type || 'concept_quiz',
      key_takeaways: Array.isArray(m.key_takeaways) ? m.key_takeaways : [],
      flashcards: Array.isArray(m.flashcards) ? m.flashcards : [],
      quiz_options: Array.isArray(m.quiz_options) ? m.quiz_options : [],
      estimated_minutes: m.estimated_minutes ?? 3,
    })) as PrepModule[]);
    if (regRes.data) setRegistration(regRes.data as any);
    setLoading(false);
  }, [seminarId, user?.id]);

  useEffect(() => { fetch(); }, [fetch]);

  const register = useCallback(async () => {
    if (!user?.id || !seminarId) return;
    const { data } = await supabase
      .from('seminar_registrations')
      .insert({ user_id: user.id, seminar_id: seminarId })
      .select()
      .single();
    if (data) setRegistration(data as any);
  }, [user?.id, seminarId]);

  const updatePrepProgress = useCallback(async (modulesDone: number, total: number) => {
    if (!user?.id || !seminarId) return;
    const prepCompleted = total > 0 && modulesDone >= total;
    await supabase
      .from('seminar_registrations')
      .update({ prep_modules_done: modulesDone, prep_completed: prepCompleted })
      .eq('user_id', user.id)
      .eq('seminar_id', seminarId);
    setRegistration(prev => prev ? { ...prev, prep_modules_done: modulesDone, prep_completed: prepCompleted } : prev);
  }, [user?.id, seminarId]);

  return { seminar, prepModules, registration, loading, register, updatePrepProgress, refetch: fetch };
}

async function attachProfilesAndLikes(messages: any[], currentUserId?: string): Promise<ChatMessage[]> {
  if (messages.length === 0) return [];
  const userIds = [...new Set(messages.map((m: any) => m.user_id))];
  const messageIds = messages.map((m: any) => m.id);

  const [profilesRes, myLikesRes] = await Promise.all([
    supabase.from('public_profiles').select('id, username, avatar_url').in('id', userIds),
    currentUserId
      ? supabase.from('seminar_message_likes').select('message_id').eq('user_id', currentUserId).in('message_id', messageIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
  const likedSet = new Set(((myLikesRes as any).data || []).map((l: any) => l.message_id));

  return messages.map((m: any) => ({
    ...m,
    parent_id: m.parent_id || null,
    like_count: m.like_count || 0,
    reply_count: m.reply_count || 0,
    username: profileMap.get(m.user_id)?.username || 'Anonymous',
    avatar_url: profileMap.get(m.user_id)?.avatar_url,
    liked_by_me: likedSet.has(m.id),
  }));
}

export function useSeminarChat(seminarId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const lastSentRef = useRef(0);

  const refetch = useCallback(async () => {
    if (!seminarId) return;
    const { data } = await supabase
      .from('seminar_chat_messages')
      .select('*')
      .eq('seminar_id', seminarId)
      .order('created_at', { ascending: true })
      .limit(500);
    if (data) {
      const enriched = await attachProfilesAndLikes(data as any[], user?.id);
      setMessages(enriched);
    }
    setLoading(false);
  }, [seminarId, user?.id]);

  useEffect(() => {
    refetch();

    const channel = supabase
      .channel(`seminar-chat-${seminarId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'seminar_chat_messages',
        filter: `seminar_id=eq.${seminarId}`,
      }, async (payload) => {
        const newMsg = payload.new as any;
        const enriched = await attachProfilesAndLikes([newMsg], user?.id);
        setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, ...enriched]);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'seminar_chat_messages',
        filter: `seminar_id=eq.${seminarId}`,
      }, (payload) => {
        const oldId = (payload.old as any).id;
        setMessages(prev => prev.filter(m => m.id !== oldId));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'seminar_chat_messages',
        filter: `seminar_id=eq.${seminarId}`,
      }, (payload) => {
        const updated = payload.new as any;
        setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, like_count: updated.like_count, reply_count: updated.reply_count, message: updated.message } : m));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [seminarId, user?.id, refetch]);

  const sendMessage = useCallback(async (text: string, parentId?: string | null) => {
    if (!user?.id || !seminarId || !text.trim()) return false;
    const now = Date.now();
    if (now - lastSentRef.current < 1500) return false;
    lastSentRef.current = now;

    const { error } = await supabase
      .from('seminar_chat_messages')
      .insert({ seminar_id: seminarId, user_id: user.id, message: text.trim(), parent_id: parentId || null });
    return !error;
  }, [user?.id, seminarId]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!user?.id) return false;
    const { error } = await supabase
      .from('seminar_chat_messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', user.id);
    if (!error) {
      setMessages(prev => prev.filter(m => m.id !== messageId && m.parent_id !== messageId));
    }
    return !error;
  }, [user?.id]);

  const toggleLike = useCallback(async (messageId: string, currentlyLiked: boolean) => {
    if (!user?.id) return false;
    // Optimistic
    setMessages(prev => prev.map(m => m.id === messageId ? {
      ...m,
      liked_by_me: !currentlyLiked,
      like_count: Math.max(0, m.like_count + (currentlyLiked ? -1 : 1)),
    } : m));

    if (currentlyLiked) {
      await supabase.from('seminar_message_likes').delete().eq('message_id', messageId).eq('user_id', user.id);
    } else {
      await supabase.from('seminar_message_likes').insert({ message_id: messageId, user_id: user.id });
    }
    return true;
  }, [user?.id]);

  return { messages, loading, sendMessage, deleteMessage, toggleLike, currentUserId: user?.id, refetch };
}
