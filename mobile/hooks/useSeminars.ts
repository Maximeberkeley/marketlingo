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
  username?: string;
  avatar_url?: string;
}

export function useSeminars(marketId?: string) {
  const { user } = useAuth();
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
      supabase.from('seminars').select('*').eq('id', seminarId).single(),
      supabase.from('seminar_prep_modules').select('*').eq('seminar_id', seminarId).order('sort_order'),
      supabase.from('seminar_registrations').select('*').eq('seminar_id', seminarId).eq('user_id', user.id).maybeSingle(),
    ]);

    if (semRes.data) setSeminar(semRes.data as any);
    setPrepModules((prepRes.data as any[] || []) as PrepModule[]);
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
    const prepCompleted = modulesDone >= total;
    await supabase
      .from('seminar_registrations')
      .update({ prep_modules_done: modulesDone, prep_completed: prepCompleted })
      .eq('user_id', user.id)
      .eq('seminar_id', seminarId);
    setRegistration(prev => prev ? { ...prev, prep_modules_done: modulesDone, prep_completed: prepCompleted } : prev);
  }, [user?.id, seminarId]);

  return { seminar, prepModules, registration, loading, register, updatePrepProgress, refetch: fetch };
}

export function useSeminarChat(seminarId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!seminarId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('seminar_chat_messages')
        .select('*')
        .eq('seminar_id', seminarId)
        .order('created_at', { ascending: true })
        .limit(200);
      
      if (data) {
        // Fetch usernames for messages
        const userIds = [...new Set((data as any[]).map((m: any) => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);
        
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        
        setMessages((data as any[]).map((m: any) => ({
          ...m,
          username: profileMap.get(m.user_id)?.username || 'Anonymous',
          avatar_url: profileMap.get(m.user_id)?.avatar_url,
        })));
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to realtime
    const channel = supabase
      .channel(`seminar-chat-${seminarId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'seminar_chat_messages',
        filter: `seminar_id=eq.${seminarId}`,
      }, async (payload) => {
        const newMsg = payload.new as any;
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', newMsg.user_id)
          .single();
        
        setMessages(prev => [...prev, {
          ...newMsg,
          username: profile?.username || 'Anonymous',
          avatar_url: profile?.avatar_url,
        }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [seminarId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!user?.id || !seminarId || !text.trim()) return false;
    
    // 3-second rate limit
    const now = Date.now();
    if (now - lastSentRef.current < 3000) return false;
    lastSentRef.current = now;

    const { error } = await supabase
      .from('seminar_chat_messages')
      .insert({ seminar_id: seminarId, user_id: user.id, message: text.trim() });
    
    return !error;
  }, [user?.id, seminarId]);

  return { messages, loading, sendMessage };
}
