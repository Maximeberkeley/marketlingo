import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Linking,
  Image,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { COLORS, SHADOWS, TYPE } from '../../lib/constants';
import { Feather } from '@expo/vector-icons';
import { MentorChatOverlay } from '../ai/MentorChatOverlay';
import { getMentorForContext } from '../../data/mentors';
import type { Mentor } from '../../data/mentors';
import { ImmersiveNewsOverlay } from './ImmersiveNewsOverlay';
// LinearGradient replaced with View fallbacks (expo-linear-gradient not installed)

// ── Types ──
interface NewsItem {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  categoryTag: string;
  summary?: string;
  imageUrl?: string | null;
}

interface DailyNewsProps {
  marketId: string;
}

// ── Category colors ──
const categoryColors: Record<string, { bg: string; text: string }> = {
  Space: { bg: 'rgba(99,102,241,0.12)', text: '#6366F1' },
  Aviation: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6' },
  Defense: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444' },
  Deals: { bg: 'rgba(245,158,11,0.12)', text: '#D97706' },
  Industry: { bg: 'rgba(16,185,129,0.12)', text: '#059669' },
  Innovation: { bg: 'rgba(139,92,246,0.12)', text: '#7C3AED' },
  Launch: { bg: 'rgba(139,92,246,0.12)', text: '#7C3AED' },
  Production: { bg: 'rgba(16,185,129,0.12)', text: '#059669' },
  Models: { bg: 'rgba(124,58,237,0.12)', text: '#7C3AED' },
  Hardware: { bg: 'rgba(6,182,212,0.12)', text: '#0891B2' },
  AI: { bg: 'rgba(16,185,129,0.12)', text: '#059669' },
  Finance: { bg: 'rgba(245,158,11,0.12)', text: '#D97706' },
  Health: { bg: 'rgba(236,72,153,0.12)', text: '#DB2777' },
  Research: { bg: 'rgba(99,102,241,0.12)', text: '#6366F1' },
  default: { bg: 'rgba(100,116,139,0.08)', text: '#64748B' },
};

const GRADIENT_SETS = [
  ['#6366F1', '#8B5CF6'],
  ['#3B82F6', '#6366F1'],
  ['#059669', '#10B981'],
  ['#D97706', '#F59E0B'],
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.75;

// ── Featured Carousel ──
function FeaturedCarousel({ items, onSelect }: { items: NewsItem[]; onSelect: (item: NewsItem) => void }) {
  const scrollX = useRef(new Animated.Value(0)).current;

  if (items.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={FEATURED_CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 4, gap: 12 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {items.map((item, i) => {
          const inputRange = [(i - 1) * (FEATURED_CARD_WIDTH + 12), i * (FEATURED_CARD_WIDTH + 12), (i + 1) * (FEATURED_CARD_WIDTH + 12)];
          const scale = scrollX.interpolate({ inputRange, outputRange: [0.95, 1, 0.95], extrapolate: 'clamp' });
          const opacity = scrollX.interpolate({ inputRange, outputRange: [0.7, 1, 0.7], extrapolate: 'clamp' });

          return (
            <Animated.View key={item.id} style={{ transform: [{ scale }], opacity, width: FEATURED_CARD_WIDTH }}>
              <TouchableOpacity activeOpacity={0.85} onPress={() => onSelect(item)} style={s.featuredCard}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={s.featuredImage} resizeMode="cover" />
                ) : (
                  <View style={[s.featuredImage, { backgroundColor: GRADIENT_SETS[i % GRADIENT_SETS.length][0] }]} />
                )}
                {/* Dark overlay for text readability */}
                <View style={[s.featuredOverlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
                <View style={s.featuredContent}>
                  <View style={[s.featuredBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={s.featuredBadgeText}>{item.categoryTag.toUpperCase()}</Text>
                  </View>
                  <Text style={s.featuredTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={s.featuredMeta}>
                    <Text style={s.featuredSource}>{item.sourceName}</Text>
                    <Text style={s.featuredDate}>{item.publishedAt}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      {/* Carousel dots */}
      <View style={s.dotsRow}>
        {items.map((_, i) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [(i - 1) * (FEATURED_CARD_WIDTH + 12), i * (FEATURED_CARD_WIDTH + 12), (i + 1) * (FEATURED_CARD_WIDTH + 12)],
            outputRange: [6, 18, 6],
            extrapolate: 'clamp',
          });
          const dotOpacity = scrollX.interpolate({
            inputRange: [(i - 1) * (FEATURED_CARD_WIDTH + 12), i * (FEATURED_CARD_WIDTH + 12), (i + 1) * (FEATURED_CARD_WIDTH + 12)],
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          return <Animated.View key={i} style={[s.dot, { width: dotWidth, opacity: dotOpacity }]} />;
        })}
      </View>
    </View>
  );
}

// ── News Feed Card ──
function NewsFeedCard({
  item,
  index,
  onSelect,
  onAiAction,
}: {
  item: NewsItem;
  index: number;
  onSelect: (item: NewsItem) => void;
  onAiAction: (item: NewsItem, action: 'discuss' | 'summarize' | 'why') => void;
}) {
  const slideAnim = useRef(new Animated.Value(24)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 50, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const catColor = categoryColors[item.categoryTag] || categoryColors.default;

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim }}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => onSelect(item)} style={s.feedCard}>
        {/* Text content */}
        <View style={s.feedCardText}>
          <View style={s.feedCardMeta}>
            <View style={[s.catBadge, { backgroundColor: catColor.bg }]}>
              <Text style={[s.catBadgeText, { color: catColor.text }]}>{item.categoryTag.toUpperCase()}</Text>
            </View>
            <Text style={s.feedDate}>{item.publishedAt}</Text>
          </View>
          <Text style={s.feedTitle} numberOfLines={3}>{item.title}</Text>
          <Text style={s.feedSource}>{item.sourceName}</Text>
        </View>

        {/* Image thumbnail on right */}
        <View style={s.feedThumb}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={s.feedThumbImage}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[s.feedThumbImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accentSoft }]}
            >
              <Feather name="file-text" size={20} color={COLORS.accent} style={{ opacity: 0.5 }} />
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* AI action buttons */}
      <View style={s.aiActionsRow}>
        {([
          { action: 'discuss' as const, icon: 'message-circle' as const, label: 'Discuss' },
          { action: 'summarize' as const, icon: 'file-text' as const, label: 'Summarize' },
          { action: 'why' as const, icon: 'zap' as const, label: 'Why it matters' },
        ]).map(({ action, icon, label }) => (
          <TouchableOpacity
            key={action}
            style={s.aiActionBtn}
            onPress={() => onAiAction(item, action)}
            activeOpacity={0.7}
          >
            <Feather name={icon} size={11} color={COLORS.textMuted} />
            <Text style={s.aiActionText}>{label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[s.aiActionBtn, { marginLeft: 'auto' }]}
          onPress={() => Linking.openURL(item.sourceUrl).catch(() => {})}
          activeOpacity={0.7}
        >
          <Feather name="external-link" size={11} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ── Article Detail Sheet ──
function ArticleDetailSheet({
  article,
  onClose,
  marketId,
}: {
  article: NewsItem | null;
  onClose: () => void;
  marketId: string;
}) {
  const [aiMode, setAiMode] = useState<'discuss' | 'summarize' | 'why' | null>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const slideAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (article) {
      slideAnim.setValue(1);
      Animated.spring(slideAnim, { toValue: 0, tension: 200, friction: 22, useNativeDriver: true }).start();
    }
  }, [article]);

  const handleClose = useCallback(() => {
    Animated.timing(slideAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start(() => {
      resetAi();
      onClose();
    });
  }, [onClose]);

  const resetAi = () => {
    setAiMode(null);
    setAiResponse('');
    setChatMessages([]);
  };

  const handleAiAction = async (mode: 'discuss' | 'summarize' | 'why') => {
    if (!article) return;
    setAiMode(mode);
    setAiLoading(true);
    setAiResponse('');

    const prompts: Record<string, string> = {
      summarize: `Provide a structured 3-bullet summary of this article: "${article.title}" from ${article.sourceName}. Context: ${article.summary || 'No additional context.'}`,
      why: `Explain in 2-3 sentences why this matters for professionals in the ${marketId} industry: "${article.title}". Context: ${article.summary || ''}`,
      discuss: `I'd like to discuss this article: "${article.title}" from ${article.sourceName}. ${article.summary || ''}. What are the key implications?`,
    };

    try {
      const { data, error } = await supabase.functions.invoke('mentor-chat', {
        body: {
          messages: [{ role: 'user', content: prompts[mode] }],
          systemPrompt: `You are an expert ${marketId} industry analyst. Be concise, insightful, and professional.`,
        },
      });
      if (error) throw error;
      const reply = data?.reply || data?.choices?.[0]?.message?.content || 'Unable to generate insight.';
      setAiResponse(reply);
      if (mode === 'discuss') {
        setChatMessages([{ role: 'user', content: prompts[mode] }, { role: 'assistant', content: reply }]);
      }
    } catch {
      setAiResponse('Failed to generate AI insight. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || aiLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    const newMessages = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(newMessages);
    setAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('mentor-chat', {
        body: {
          messages: newMessages,
          systemPrompt: `You are an expert ${marketId} industry analyst discussing: "${article?.title}". Be concise and insightful.`,
        },
      });
      if (error) throw error;
      const reply = data?.reply || data?.choices?.[0]?.message?.content || '...';
      setChatMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch {
      setChatMessages([...newMessages, { role: 'assistant', content: 'Failed to respond.' }]);
    } finally {
      setAiLoading(false);
    }
  };

  if (!article) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Dimensions.get('window').height],
  });

  return (
    <Modal visible={!!article} transparent animationType="none" onRequestClose={handleClose}>
      <View style={ds.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
        <Animated.View style={[ds.sheet, { transform: [{ translateY }] }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            {/* Handle */}
            <View style={ds.handleRow}>
              <View style={ds.handle} />
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} bounces={true}>
              {/* Hero image */}
              {article.imageUrl ? (
                <View style={ds.heroContainer}>
                  <Image source={{ uri: article.imageUrl }} style={ds.heroImage} resizeMode="cover" />
                  <View style={[ds.heroGradient, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                </View>
              ) : null}

              <View style={ds.contentPad}>
                {/* Meta */}
                <View style={ds.metaRow}>
                  <View style={[ds.badge, { backgroundColor: COLORS.accentSoft }]}>
                    <Text style={[ds.badgeText, { color: COLORS.accent }]}>{article.categoryTag.toUpperCase()}</Text>
                  </View>
                  <Text style={ds.metaSource}>{article.sourceName}</Text>
                  <Text style={ds.metaDate}>{article.publishedAt}</Text>
                </View>

                {/* Title */}
                <Text style={ds.title}>{article.title}</Text>

                {/* Summary */}
                {article.summary ? <Text style={ds.summary}>{article.summary}</Text> : null}

                {/* Source link */}
                <TouchableOpacity onPress={() => Linking.openURL(article.sourceUrl).catch(() => {})} style={ds.sourceLink}>
                  <Feather name="external-link" size={14} color={COLORS.accent} />
                  <Text style={ds.sourceLinkText}>Read full article</Text>
                </TouchableOpacity>

                {/* AI Insights section */}
                <View style={ds.aiSection}>
                  <Text style={ds.aiSectionTitle}>AI-POWERED INSIGHTS</Text>
                  <View style={ds.aiButtonsRow}>
                    {([
                      { mode: 'discuss' as const, icon: 'message-circle' as const, label: 'Discuss' },
                      { mode: 'summarize' as const, icon: 'file-text' as const, label: 'Summarize' },
                      { mode: 'why' as const, icon: 'zap' as const, label: 'Why it matters' },
                    ]).map(({ mode, icon, label }) => (
                      <TouchableOpacity
                        key={mode}
                        onPress={() => { resetAi(); handleAiAction(mode); }}
                        style={[ds.aiBtn, aiMode === mode && ds.aiBtnActive]}
                        activeOpacity={0.7}
                      >
                        <Feather name={icon} size={13} color={aiMode === mode ? COLORS.accent : COLORS.textMuted} />
                        <Text style={[ds.aiBtnText, aiMode === mode && { color: COLORS.accent }]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* AI response */}
                  {(aiLoading || aiResponse) ? (
                    <View style={ds.aiResponseBox}>
                      {aiLoading && !aiResponse ? (
                        <View style={ds.aiLoadingRow}>
                          <ActivityIndicator size="small" color={COLORS.accent} />
                          <Text style={ds.aiLoadingText}>Analyzing...</Text>
                        </View>
                      ) : aiMode === 'discuss' ? (
                        <View>
                          {chatMessages.map((msg, i) => (
                            <Text key={i} style={[ds.chatMsg, msg.role === 'user' ? ds.chatMsgUser : ds.chatMsgAi]}>
                              {msg.content}
                            </Text>
                          ))}
                          {aiLoading && (
                            <View style={ds.aiLoadingRow}>
                              <ActivityIndicator size="small" color={COLORS.accent} />
                              <Text style={ds.aiLoadingText}>Thinking...</Text>
                            </View>
                          )}
                          <View style={ds.chatInputRow}>
                            <TextInput
                              value={chatInput}
                              onChangeText={setChatInput}
                              placeholder="Ask a follow-up..."
                              placeholderTextColor={COLORS.textMuted}
                              style={ds.chatInput}
                              onSubmitEditing={handleChatSend}
                              returnKeyType="send"
                            />
                            <TouchableOpacity onPress={handleChatSend} disabled={!chatInput.trim() || aiLoading} style={[ds.chatSendBtn, (!chatInput.trim() || aiLoading) && { opacity: 0.4 }]}>
                              <Feather name="send" size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <Text style={ds.aiResponseText}>{aiResponse}</Text>
                      )}
                    </View>
                  ) : null}
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Main Component ──
export function DailyNews({ marketId }: DailyNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [chatNewsItem, setChatNewsItem] = useState<NewsItem | null>(null);
  const [chatContext, setChatContext] = useState('');

  const kaiMentor: Mentor = getMentorForContext('news') || {
    id: 'kai', name: 'Kai', title: 'Market Analyst', expertise: ['markets'],
    personality: 'analytical', emoji: '', greeting: 'Hi!', specialties: ['news'],
    voiceId: 'iP95p4xoKVk53GoZ742B',
  };

  const mapDbItem = (item: any): NewsItem => ({
    id: item.id,
    title: item.title,
    sourceName: item.source_name,
    sourceUrl: item.source_url,
    publishedAt: new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    categoryTag: item.category_tag || 'Industry',
    summary: item.summary || undefined,
    imageUrl: item.image_url || undefined,
  });

  const fetchNews = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      if (!forceRefresh) {
        const { data, error: dbError } = await supabase
          .from('news_items').select('*').eq('market_id', marketId)
          .order('published_at', { ascending: false }).limit(10);

        if (!dbError && data && data.length > 0) {
          setNews(data.map(mapDbItem));
          setLastFetched(new Date());
          setIsLoading(false); setIsRefreshing(false); return;
        }
      }

      const { data: liveData, error: fnError } = await supabase.functions.invoke('fetch-market-news', { body: { marketId } });

      if (!fnError && liveData?.success && liveData.data?.length > 0) {
        setNews(liveData.data.map((item: any) => ({
          id: item.id, title: item.title, sourceName: item.sourceName,
          sourceUrl: item.sourceUrl, publishedAt: item.publishedAt,
          categoryTag: item.categoryTag || 'Industry', summary: item.summary || undefined,
          imageUrl: item.imageUrl || undefined,
        })));
        setLastFetched(new Date());
      } else {
        const { data: fallback } = await supabase
          .from('news_items').select('*').eq('market_id', marketId)
          .order('published_at', { ascending: false }).limit(10);

        if (fallback && fallback.length > 0) {
          setNews(fallback.map(mapDbItem));
          setLastFetched(new Date());
        } else { setNews([]); }
      }
    } catch {
      setError('Failed to connect to news service');
    } finally {
      setIsLoading(false); setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchNews(); }, [marketId]);

  const handleAiAction = (item: NewsItem, action: 'discuss' | 'summarize' | 'why') => {
    const contextMap: Record<string, string> = {
      discuss: `The user wants to discuss this ${marketId} industry news article:\n\nTitle: "${item.title}"\nSource: ${item.sourceName}\nSummary: ${item.summary ?? 'N/A'}\n\nHelp them understand the key implications.`,
      summarize: `Provide a structured 3-bullet summary of: "${item.title}" from ${item.sourceName}. Context: ${item.summary || 'N/A'}`,
      why: `Explain why this matters for ${marketId} professionals: "${item.title}". Context: ${item.summary || 'N/A'}`,
    };
    setChatContext(contextMap[action]);
    setChatNewsItem(item);
  };

  const featured = news.slice(0, 3);
  const feed = news.slice(3);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.headerIconBg}>
            <Feather name="zap" size={14} color={COLORS.accent} />
          </View>
          <View>
            <Text style={s.headerTitle}>Industry Intel</Text>
            <Text style={s.headerSubtitle}>AI-analyzed insights</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => fetchNews(true)} disabled={isRefreshing} style={[s.refreshBtn, isRefreshing && { opacity: 0.5 }]}>
          <Feather name="refresh-cw" size={14} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {isLoading && (
        <View style={s.loadingContainer}>
          {[1, 2].map((i) => (
            <View key={i} style={s.skeletonCard}>
              <View style={s.skeletonLine} />
              <View style={[s.skeletonLine, { width: '75%' }]} />
              <View style={[s.skeletonLine, { width: '40%', height: 10 }]} />
            </View>
          ))}
        </View>
      )}

      {/* Error */}
      {!isLoading && error && (
        <View style={s.emptyCard}>
          <Text style={s.emptyText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchNews(true)} style={s.retryBtn}>
            <Text style={s.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {!isLoading && !error && news.length > 0 && (
        <View>
          {/* Featured horizontal carousel */}
          <FeaturedCarousel items={featured} onSelect={setSelectedArticle} />

          {/* Feed section label */}
          {feed.length > 0 && (
            <View style={s.feedSectionHeader}>
              <View style={s.feedSectionLine} />
              <Text style={s.feedSectionLabel}>LATEST</Text>
              <View style={s.feedSectionLine} />
            </View>
          )}

          {/* Vertical feed */}
          <View style={{ gap: 2 }}>
            {feed.map((item, index) => (
              <NewsFeedCard
                key={item.id}
                item={item}
                index={index}
                onSelect={setSelectedArticle}
                onAiAction={handleAiAction}
              />
            ))}
          </View>
        </View>
      )}

      {/* Empty */}
      {!isLoading && !error && news.length === 0 && (
        <View style={s.emptyCard}>
          <Feather name="inbox" size={28} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
          <Text style={s.emptyText}>No news available right now</Text>
          <TouchableOpacity onPress={() => fetchNews(true)} style={s.retryBtn}>
            <Text style={s.retryText}>Fetch News</Text>
          </TouchableOpacity>
        </View>
      )}

      {lastFetched && !isLoading && news.length > 0 && (
        <Text style={s.lastUpdated}>Updated {lastFetched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      )}

      {/* Article Detail Sheet */}
      <ArticleDetailSheet article={selectedArticle} onClose={() => setSelectedArticle(null)} marketId={marketId} />

      {/* AI Chat overlay (from AI action buttons) */}
      {chatNewsItem && (
        <MentorChatOverlay
          visible={!!chatNewsItem}
          mentor={kaiMentor}
          onClose={() => setChatNewsItem(null)}
          context={chatContext}
          marketId={marketId}
        />
      )}
    </View>
  );
}

// ── Styles ──
const s = StyleSheet.create({
  container: {},

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBg: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.accentSoft,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.accentMedium,
  },
  headerTitle: { ...TYPE.h3, color: COLORS.textPrimary },
  headerSubtitle: { fontSize: 11, color: COLORS.textMuted },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.bg1, alignItems: 'center', justifyContent: 'center' },

  // Featured carousel
  featuredCard: { height: 200, borderRadius: 20, overflow: 'hidden', ...SHADOWS.md },
  featuredImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  featuredOverlay: { ...StyleSheet.absoluteFillObject },
  featuredContent: { ...StyleSheet.absoluteFillObject, padding: 16, justifyContent: 'flex-end' },
  featuredBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginBottom: 8 },
  featuredBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff', letterSpacing: 0.8 },
  featuredTitle: { fontSize: 16, fontWeight: '800', color: '#fff', lineHeight: 21, marginBottom: 6 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredSource: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  featuredDate: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },

  // Dots
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10 },
  dot: { height: 3, borderRadius: 2, backgroundColor: COLORS.accent },

  // Feed section
  feedSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  feedSectionLine: { flex: 1, height: 1, backgroundColor: COLORS.borderLight },
  feedSectionLabel: { ...TYPE.overline, color: COLORS.textMuted, fontSize: 10 },

  // Feed card
  feedCard: {
    flexDirection: 'row', backgroundColor: COLORS.bg2, borderRadius: 16,
    padding: 12, gap: 12, borderWidth: 1, borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  feedCardText: { flex: 1, justifyContent: 'space-between' },
  feedCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  catBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  catBadgeText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  feedDate: { fontSize: 10, color: COLORS.textMuted },
  feedTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 19, marginBottom: 4 },
  feedSource: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },

  // Feed thumbnail (right side)
  feedThumb: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  feedThumbImage: { width: '100%', height: '100%' },

  // AI action buttons
  aiActionsRow: {
    flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 12,
    paddingBottom: 10, paddingTop: 4,
  },
  aiActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 12,
  },
  aiActionText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },

  // Loading / empty
  loadingContainer: { gap: 8 },
  skeletonCard: { padding: 14, backgroundColor: COLORS.bg1, borderRadius: 14, borderWidth: 1, borderColor: COLORS.borderLight, gap: 8 },
  skeletonLine: { height: 14, backgroundColor: COLORS.surfaceLight, borderRadius: 7, width: '100%' },
  emptyCard: { padding: 28, backgroundColor: COLORS.bg1, borderRadius: 16, borderWidth: 1, borderColor: COLORS.borderLight, alignItems: 'center', gap: 8 },
  emptyText: { ...TYPE.body, color: COLORS.textMuted, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.accentSoft, borderRadius: 20, borderWidth: 1, borderColor: COLORS.accentMedium },
  retryText: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  lastUpdated: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 10 },
});

// ── Detail Sheet Styles ──
const ds = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '92%', backgroundColor: COLORS.bg0, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    overflow: 'hidden', ...SHADOWS.lg,
  },
  handleRow: { alignItems: 'center', paddingVertical: 8 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },

  heroContainer: { width: '100%', height: 200, overflow: 'hidden' },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject, top: '50%' },

  contentPad: { paddingHorizontal: 20, paddingBottom: 40 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 10 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  metaSource: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  metaDate: { fontSize: 10, color: COLORS.textMuted },

  title: { ...TYPE.h1, color: COLORS.textPrimary, marginBottom: 12 },
  summary: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 24, marginBottom: 16 },

  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  sourceLinkText: { ...TYPE.bodyBold, color: COLORS.accent },

  // AI section
  aiSection: { borderTopWidth: 1, borderTopColor: COLORS.borderLight, paddingTop: 16 },
  aiSectionTitle: { ...TYPE.overline, color: COLORS.textMuted, marginBottom: 12 },
  aiButtonsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  aiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14,
    backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  aiBtnActive: { backgroundColor: COLORS.accentSoft, borderColor: COLORS.accentMedium },
  aiBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },

  aiResponseBox: {
    backgroundColor: COLORS.bg1, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  aiLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiLoadingText: { ...TYPE.caption, color: COLORS.textMuted },
  aiResponseText: { ...TYPE.body, color: COLORS.textPrimary, lineHeight: 22 },

  chatMsg: { marginBottom: 10, lineHeight: 20 },
  chatMsgUser: { ...TYPE.bodyBold, color: COLORS.textPrimary },
  chatMsgAi: { ...TYPE.body, color: COLORS.textSecondary },
  chatInputRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chatInput: {
    flex: 1, backgroundColor: COLORS.bg0, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: COLORS.textPrimary,
  },
  chatSendBtn: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center',
  },
});
