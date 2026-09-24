import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
export function useSeminars(marketId) {
    const [seminars, setSeminars] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchSeminars = useCallback(async () => {
        if (!marketId)
            return;
        setLoading(true);
        const { data } = await supabase
            .from('seminars')
            .select('*')
            .eq('market_id', marketId)
            .order('scheduled_at', { ascending: true });
        setSeminars((data || []));
        setLoading(false);
    }, [marketId]);
    useEffect(() => { fetchSeminars(); }, [fetchSeminars]);
    return { seminars, loading, refetch: fetchSeminars };
}
export function useSeminarDetail(seminarId) {
    const { user } = useAuth();
    const [seminar, setSeminar] = useState(null);
    const [prepModules, setPrepModules] = useState([]);
    const [registration, setRegistration] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetch = useCallback(async () => {
        if (!seminarId || !user?.id)
            return;
        setLoading(true);
        const [semRes, prepRes, regRes] = await Promise.all([
            supabase.from('seminars').select('*').eq('id', seminarId).maybeSingle(),
            supabase.from('seminar_prep_modules').select('*').eq('seminar_id', seminarId).order('sort_order'),
            supabase.from('seminar_registrations').select('*').eq('seminar_id', seminarId).eq('user_id', user.id).maybeSingle(),
        ]);
        if (semRes.data)
            setSeminar(semRes.data);
        setPrepModules((prepRes.data || []).map((m) => ({
            ...m,
            module_type: m.module_type || 'concept_quiz',
            key_takeaways: Array.isArray(m.key_takeaways) ? m.key_takeaways : [],
            flashcards: Array.isArray(m.flashcards) ? m.flashcards : [],
            quiz_options: Array.isArray(m.quiz_options) ? m.quiz_options : [],
            estimated_minutes: m.estimated_minutes ?? 3,
        })));
        if (regRes.data)
            setRegistration(regRes.data);
        setLoading(false);
    }, [seminarId, user?.id]);
    useEffect(() => { fetch(); }, [fetch]);
    const register = useCallback(async () => {
        if (!user?.id || !seminarId)
            return;
        const { data } = await supabase
            .from('seminar_registrations')
            .insert({ user_id: user.id, seminar_id: seminarId })
            .select()
            .single();
        if (data)
            setRegistration(data);
    }, [user?.id, seminarId]);
    const updatePrepProgress = useCallback(async (modulesDone, total) => {
        if (!user?.id || !seminarId)
            return;
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
async function attachProfilesAndLikes(messages, currentUserId) {
    if (messages.length === 0)
        return [];
    const userIds = [...new Set(messages.map((m) => m.user_id))];
    const messageIds = messages.map((m) => m.id);
    const [profilesRes, myLikesRes] = await Promise.all([
        supabase.from('public_profiles').select('id, username, avatar_url').in('id', userIds),
        currentUserId
            ? supabase.from('seminar_message_likes').select('message_id').eq('user_id', currentUserId).in('message_id', messageIds)
            : Promise.resolve({ data: [] }),
    ]);
    const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p]));
    const likedSet = new Set((myLikesRes.data || []).map((l) => l.message_id));
    return messages.map((m) => ({
        ...m,
        parent_id: m.parent_id || null,
        like_count: m.like_count || 0,
        reply_count: m.reply_count || 0,
        username: profileMap.get(m.user_id)?.username || 'Anonymous',
        avatar_url: profileMap.get(m.user_id)?.avatar_url,
        liked_by_me: likedSet.has(m.id),
    }));
}
export function useSeminarChat(seminarId) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const lastSentRef = useRef(0);
    const refetch = useCallback(async () => {
        if (!seminarId)
            return;
        const { data } = await supabase
            .from('seminar_chat_messages')
            .select('*')
            .eq('seminar_id', seminarId)
            .order('created_at', { ascending: true })
            .limit(500);
        if (data) {
            const enriched = await attachProfilesAndLikes(data, user?.id);
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
            const newMsg = payload.new;
            const enriched = await attachProfilesAndLikes([newMsg], user?.id);
            setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, ...enriched]);
        })
            .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'seminar_chat_messages',
            filter: `seminar_id=eq.${seminarId}`,
        }, (payload) => {
            const oldId = payload.old.id;
            setMessages(prev => prev.filter(m => m.id !== oldId));
        })
            .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'seminar_chat_messages',
            filter: `seminar_id=eq.${seminarId}`,
        }, (payload) => {
            const updated = payload.new;
            setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, like_count: updated.like_count, reply_count: updated.reply_count, message: updated.message } : m));
        })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [seminarId, user?.id, refetch]);
    const sendMessage = useCallback(async (text, parentId) => {
        if (!user?.id || !seminarId || !text.trim())
            return false;
        const now = Date.now();
        if (now - lastSentRef.current < 1500)
            return false;
        lastSentRef.current = now;
        const { error } = await supabase
            .from('seminar_chat_messages')
            .insert({ seminar_id: seminarId, user_id: user.id, message: text.trim(), parent_id: parentId || null });
        return !error;
    }, [user?.id, seminarId]);
    const deleteMessage = useCallback(async (messageId) => {
        if (!user?.id)
            return false;
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
    const toggleLike = useCallback(async (messageId, currentlyLiked) => {
        if (!user?.id)
            return false;
        // Optimistic
        setMessages(prev => prev.map(m => m.id === messageId ? {
            ...m,
            liked_by_me: !currentlyLiked,
            like_count: Math.max(0, m.like_count + (currentlyLiked ? -1 : 1)),
        } : m));
        if (currentlyLiked) {
            await supabase.from('seminar_message_likes').delete().eq('message_id', messageId).eq('user_id', user.id);
        }
        else {
            await supabase.from('seminar_message_likes').insert({ message_id: messageId, user_id: user.id });
        }
        return true;
    }, [user?.id]);
    return { messages, loading, sendMessage, deleteMessage, toggleLike, currentUserId: user?.id, refetch };
}
