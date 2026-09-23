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
import { COLORS, TYPE, SHADOWS } from '../../lib/constants';
import { Feather } from '@expo/vector-icons';
import { MentorChatOverlay } from '../ai/MentorChatOverlay';
import { getMentorForContext } from '../../data/mentors';
import type { Mentor } from '../../data/mentors';
import { ImmersiveNewsOverlay } from './ImmersiveNewsOverlay';
import { triggerHaptic } from '../../lib/haptics';
import { log } from '../../lib/logger';
import { useIntelHabit } from '../../hooks/useIntelHabit';

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
  impact?: 'high' | 'medium' | 'low';
}

interface DailyNewsProps {
  marketId: string;
  learningGoal?: string;
  /** When true, opens the first story immediately (Leo sent them here). */
  autoOpen?: boolean;
}

// ── Impact helper – only surfaces "high" items with an exclamation mark ──

// ── Category colors ──
const GRADIENT_SETS = [
  ['#6366F1', '#8B5CF6'],
  ['#3B82F6', '#6366F1'],
  ['#059669', '#10B981'],
  ['#D97706', '#F59E0B'],
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = SCREEN_WIDTH - 32;

type NewsQuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

function buildFallbackQuiz(article: NewsItem): NewsQuizQuestion[] {
  return [
    {
      question: `What is the clearest takeaway from "${article.title}"?`,
      options: [
        'It highlights a meaningful new development in the industry.',
        'It is mostly unrelated background noise.',
        'It only covers consumer entertainment trends.',
        'It is purely a historical recap with no current relevance.',
      ],
      correctIndex: 0,
      explanation: 'The article was surfaced because it points to a relevant development professionals should pay attention to.',
    },
    {
      question: `Why could this story matter for people following the ${article.categoryTag || 'industry'} space?`,
      options: [
        'It can influence how people interpret market direction and competitive moves.',
        'It has no practical impact beyond trivia.',
        'It only matters to people outside the industry.',
        'It is important only because of the headline wording.',
      ],
      correctIndex: 0,
      explanation: 'Good news analysis connects the article to broader market direction, execution, or strategic implications.',
    },
  ];
}

function normalizeQuizQuestions(payload: unknown): NewsQuizQuestion[] | null {
  const questionList = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { questions?: unknown[] }).questions)
      ? (payload as { questions: unknown[] }).questions
      : null;

  if (!questionList) return null;

  const normalized = questionList
    .map((item) => {
      if (!item || typeof item !== 'object') return null;

      const candidate = item as {
        question?: unknown;
        options?: unknown;
        correctIndex?: unknown;
        explanation?: unknown;
      };

      const question = typeof candidate.question === 'string' ? candidate.question.trim() : '';
      const options = Array.isArray(candidate.options)
        ? candidate.options.filter((option): option is string => typeof option === 'string' && option.trim().length > 0).slice(0, 4)
        : [];
      const explanation = typeof candidate.explanation === 'string' && candidate.explanation.trim().length > 0
        ? candidate.explanation.trim()
        : 'Review the article again to reinforce the main takeaway.';
      const rawCorrectIndex = typeof candidate.correctIndex === 'number'
        ? candidate.correctIndex
        : Number(candidate.correctIndex);

      if (!question || options.length < 2) return null;

      return {
        question,
        options,
        correctIndex: Number.isInteger(rawCorrectIndex) && rawCorrectIndex >= 0 && rawCorrectIndex < options.length ? rawCorrectIndex : 0,
        explanation,
      };
    })
    .filter((item): item is NewsQuizQuestion => item !== null)
    .slice(0, 2);

  return normalized.length > 0 ? normalized : null;
}

function extractQuizResponseText(data: any) {
  const rawContent =
    data?.message ||
    data?.reply ||
    data?.response ||
    data?.content ||
    data?.choices?.[0]?.message?.content ||
    '';

  return typeof rawContent === 'string' ? rawContent.trim() : '';
}

// ── Impact dot helper ──
function getImpactFromContent(title: string, summary?: string): 'high' | 'medium' | 'low' {
  const text = (title + ' ' + (summary || '')).toLowerCase();
  const highSignals = ['billion', 'acquisition', 'merger', 'ipo', 'fda approval', 'breakthrough', 'banned', 'regulation', 'crisis', 'record'];
  const mediumSignals = ['million', 'partnership', 'launch', 'raises', 'new', 'first', 'major', 'expands'];
  if (highSignals.some(s => text.includes(s))) return 'high';
  if (mediumSignals.some(s => text.includes(s))) return 'medium';
  return 'low';
}

// ── Featured Carousel ──
function FeaturedCarousel({ items, onSelect }: { items: NewsItem[]; onSelect: (item: NewsItem) => void }) {
  const scrollX = useRef(new Animated.Value(0)).current;

  if (items.length === 0) return null;

  return (
    <View style={s.featuredCarousel}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={FEATURED_CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={s.featuredTrack}
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
                {item?.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={s.featuredImage} resizeMode="cover" />
                ) : (
                  <View style={[s.featuredImage, { backgroundColor: GRADIENT_SETS[i % GRADIENT_SETS.length][0] }]} />
                )}
                <View style={s.featuredOverlay} />
                <View style={s.featuredContent}>
                  <View style={s.featuredTopRow}>
                    <View style={s.featuredBadge}>
                      <Text style={s.featuredBadgeText}>{(item?.categoryTag || 'Industry').toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={s.featuredTitle} numberOfLines={2}>{item?.title || 'Untitled Story'}</Text>
                  {item?.summary ? (
                    <Text style={s.featuredSummary} numberOfLines={1}>{item.summary}</Text>
                  ) : null}
                  <View style={s.featuredMeta}>
                    <Text style={s.featuredSource}>{item?.sourceName || 'Industry News'}</Text>
                    <Text style={s.featuredDate}>{item?.publishedAt || 'Recent'}</Text>
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
}: {
  item: NewsItem;
  index: number;
  onSelect: (item: NewsItem) => void;
}) {
  const slideAnim = useRef(new Animated.Value(24)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: index * 50, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim }}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => onSelect(item)} style={s.feedCard}>
        {/* Text content */}
        <View style={s.feedCardText}>
          <Text style={s.feedSource} numberOfLines={1}>{item?.sourceName || 'Industry News'}</Text>
          <Text style={s.feedTitle} numberOfLines={3}>{item?.title || 'Untitled Story'}</Text>
          <View style={s.feedFooter}>
            <Text style={s.feedDate}>{item?.publishedAt || 'Recent'}</Text>
            <Feather name="more-horizontal" size={19} color={COLORS.intelMuted} />
          </View>
        </View>

        {/* Image thumbnail on right */}
        <View style={s.feedThumb}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={s.feedThumbImage} resizeMode="cover" />
          ) : (
            <View style={[s.feedThumbImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accentSoft }]}>
              <Feather name="file-text" size={20} color={COLORS.accent} style={{ opacity: 0.5 }} />
            </View>
          )}
        </View>
      </TouchableOpacity>

    </Animated.View>
  );
}

// ── Quiz Modal ──
function QuizModal({
  article,
  marketId,
  onClose,
}: {
  article: NewsItem | null;
  marketId: string;
  onClose: () => void;
}) {
  const [questions, setQuestions] = useState<NewsQuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (article) {
      generateQuiz();
    }
  }, [article]);

  const generateQuiz = async () => {
    if (!article) return;
    setLoading(true);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setScore(0);

    try {
      const { data, error } = await supabase.functions.invoke('mentor-chat', {
        body: {
          messages: [
            {
              role: 'user',
              content: `Generate exactly 2 quiz questions about this ${marketId} industry news article to test understanding.

Article: "${article.title}"
Summary: ${article.summary || 'N/A'}
Source: ${article.sourceName}

Respond ONLY with a valid JSON array of objects, each with:
- "question": string
- "options": array of 4 strings
- "correctIndex": number (0-3)
- "explanation": string (1 sentence explaining the correct answer)

No other text, just the JSON array.`,
            },
          ],
          systemPrompt: `You are a ${marketId} industry quiz master. Create questions that test comprehension and critical thinking about current events. Make them challenging but fair. Respond ONLY with valid JSON.`,
        },
      });

      if (error) throw error;
      const content = extractQuizResponseText(data);
      const cleanedContent = content
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      const jsonCandidate = cleanedContent.match(/\[[\s\S]*\]/)?.[0] || cleanedContent;

      let parsedQuestions: NewsQuizQuestion[] | null = null;

      if (jsonCandidate) {
        try {
          parsedQuestions = normalizeQuizQuestions(JSON.parse(jsonCandidate));
        } catch (parseError) {
          log.warn('Failed to parse news quiz response:', parseError);
        }
      }

      setQuestions(parsedQuestions || buildFallbackQuiz(article));
    } catch (quizError) {
      log.warn('Failed to generate news quiz:', quizError);
      setQuestions(buildFallbackQuiz(article));
    } finally {
      setLoading(false);
    }
  };

  if (!article) return null;

  const q = questions[currentQ];
  const isComplete = currentQ >= questions.length && questions.length > 0;

  return (
    <Modal visible={!!article} transparent animationType="slide" onRequestClose={onClose}>
      <View style={qz.backdrop}>
        <View style={qz.sheet}>
          <View style={qz.handleRow}>
            <View style={qz.handle} />
          </View>

          {/* Header */}
          <View style={qz.header}>
            <View style={qz.headerIcon}>
              <Feather name="help-circle" size={16} color={COLORS.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={qz.headerTitle}>News Quiz</Text>
              <Text style={qz.headerSub} numberOfLines={1}>{article.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={qz.bodyScroll}
            contentContainerStyle={qz.bodyScrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {loading ? (
              <View style={qz.loadingBox}>
                <ActivityIndicator size="small" color={COLORS.accent} />
                <Text style={qz.loadingText}>Generating quiz from this article...</Text>
              </View>
            ) : isComplete ? (
              <View style={qz.completeBox}>
                <Text style={qz.completeEmoji}>{score === questions.length ? '🎉' : score > 0 ? '👏' : '📖'}</Text>
                <Text style={qz.completeTitle}>
                  {score === questions.length ? 'Perfect!' : score > 0 ? 'Nice work!' : 'Keep learning!'}
                </Text>
                <Text style={qz.completeScore}>{score}/{questions.length} correct</Text>
                <TouchableOpacity onPress={onClose} style={qz.doneBtn}>
                  <Text style={qz.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : q ? (
              <View style={qz.questionBox}>
                <Text style={qz.qNumber}>Question {currentQ + 1} of {questions.length}</Text>
                <Text style={qz.qText}>{q.question}</Text>

                {q.options.map((opt, i) => {
                  const isSelected = selectedAnswer === i;
                  const isCorrect = i === q.correctIndex;
                  const showResult = selectedAnswer !== null;

                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        qz.optionBtn,
                        showResult && isCorrect && qz.optionCorrect,
                        showResult && isSelected && !isCorrect && qz.optionWrong,
                        !showResult && isSelected && qz.optionSelected,
                      ]}
                      onPress={() => {
                        if (selectedAnswer !== null) return;
                        setSelectedAnswer(i);
                        if (i === q.correctIndex) setScore(s => s + 1);
                        triggerHaptic(i === q.correctIndex ? 'success' : 'error');
                      }}
                      activeOpacity={0.7}
                      disabled={selectedAnswer !== null}
                    >
                      <Text style={[
                        qz.optionText,
                        showResult && isCorrect && { color: '#059669', fontWeight: '700' },
                        showResult && isSelected && !isCorrect && { color: '#EF4444' },
                      ]}>
                        {opt}
                      </Text>
                      {showResult && isCorrect && <Feather name="check-circle" size={16} color="#059669" />}
                      {showResult && isSelected && !isCorrect && <Feather name="x-circle" size={16} color="#EF4444" />}
                    </TouchableOpacity>
                  );
                })}

                {selectedAnswer !== null && (
                  <View style={qz.explainBox}>
                    <Feather name="info" size={13} color={COLORS.accent} />
                    <Text style={qz.explainText}>{q.explanation}</Text>
                  </View>
                )}

                {selectedAnswer !== null && (
                  <TouchableOpacity
                    style={qz.nextBtn}
                    onPress={() => {
                      setSelectedAnswer(null);
                      setCurrentQ(c => c + 1);
                    }}
                  >
                    <Text style={qz.nextBtnText}>
                      {currentQ + 1 < questions.length ? 'Next Question' : 'See Results'}
                    </Text>
                    <Feather name="arrow-right" size={14} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
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

  const resetAi = () => { setAiMode(null); setAiResponse(''); setChatMessages([]); };

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

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, Dimensions.get('window').height] });
  const isHighImpact = (article.impact || getImpactFromContent(article.title, article.summary)) === 'high';

  return (
    <Modal visible={!!article} transparent animationType="none" onRequestClose={handleClose}>
      <View style={ds.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
        <Animated.View style={[ds.sheet, { transform: [{ translateY }] }]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={ds.handleRow}><View style={ds.handle} /></View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} bounces={true}>
              {article.imageUrl ? (
                <View style={ds.heroContainer}>
                  <Image source={{ uri: article.imageUrl }} style={ds.heroImage} resizeMode="cover" />
                  <View style={[ds.heroGradient, { backgroundColor: 'rgba(255,255,255,0.3)' }]} />
                </View>
              ) : null}

              <View style={ds.contentPad}>
                <View style={ds.metaRow}>
                  <View style={[ds.badge, { backgroundColor: COLORS.accentSoft }]}>
                    <Text style={[ds.badgeText, { color: COLORS.accent }]}>{(article.categoryTag || 'Industry').toUpperCase()}</Text>
                  </View>
                  {isHighImpact && (
                    <View style={ds.highImpactPill}>
                      <Feather name="alert-circle" size={10} color="#EF4444" />
                      <Text style={ds.highImpactText}>High Impact</Text>
                    </View>
                  )}
                  <Text style={ds.metaSource}>{article.sourceName}</Text>
                  <Text style={ds.metaDate}>{article.publishedAt}</Text>
                </View>

                <Text style={ds.title}>{article.title}</Text>
                {article.summary ? <Text style={ds.summary}>{article.summary}</Text> : null}

                <TouchableOpacity onPress={() => { if (article.sourceUrl) Linking.openURL(article.sourceUrl).catch(() => {}); }} style={ds.sourceLink}>
                  <Feather name="external-link" size={14} color={COLORS.accent} />
                  <Text style={ds.sourceLinkText}>Read full article</Text>
                </TouchableOpacity>

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
                            <Text key={i} style={[ds.chatMsg, msg.role === 'user' ? ds.chatMsgUser : ds.chatMsgAi]}>{msg.content}</Text>
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
export function DailyNews({ marketId, learningGoal, autoOpen = false }: DailyNewsProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [immersiveIndex, setImmersiveIndex] = useState(-1);
  const [chatNewsItem, setChatNewsItem] = useState<NewsItem | null>(null);
  const [chatContext, setChatContext] = useState('');
  const [quizArticle, setQuizArticle] = useState<NewsItem | null>(null);
  const intel = useIntelHabit(marketId);
  const autoOpened = useRef(false);

  /** Open a story and count it toward today's 3 intel reads. */
  const openStory = useCallback((items: NewsItem[], index: number) => {
    const safe = index >= 0 ? index : 0;
    setImmersiveIndex(safe);
    const item = items[safe];
    if (item) intel.recordRead(item.id);
  }, [intel]);

  const kaiMentor: Mentor = getMentorForContext('news') || {
    id: 'kai', name: 'Kai', title: 'Market Analyst', expertise: ['markets'],
    personality: 'analytical', emoji: '', greeting: 'Hi!', specialties: ['news'],
    voiceId: 'iP95p4xoKVk53GoZ742B',
  };

  const mapDbItem = (item: any): NewsItem => {
    const title = typeof item?.title === 'string' && item.title.trim() ? item.title : 'Untitled Story';
    const publishedRaw = item?.published_at ? new Date(item.published_at) : null;
    const publishedAt = publishedRaw && !isNaN(publishedRaw.getTime())
      ? publishedRaw.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'Recent';
    return {
      id: item?.id ?? `news-${Math.random().toString(36).slice(2)}`,
      title,
      sourceName: item?.source_name || 'Industry News',
      sourceUrl: item?.source_url || '',
      publishedAt,
      categoryTag: item?.category_tag || 'Industry',
      summary: item?.summary || undefined,
      imageUrl: item?.image_url || undefined,
      impact: getImpactFromContent(title, item?.summary),
    };
  };

  const fetchNews = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      if (!forceRefresh) {
        const { data, error: dbError } = await supabase
          .from('news_items').select('*').eq('market_id', marketId)
          .order('published_at', { ascending: false }).limit(15);

        if (!dbError && data && data.length > 0) {
          setNews(data.map(mapDbItem));
          setLastFetched(new Date());
          setIsLoading(false);
          setIsRefreshing(false);

          const hasAnyMissingImages = data.some((item: any) => !item.image_url);
          if (hasAnyMissingImages) {
            supabase.functions.invoke('fetch-market-news', { body: { marketId } }).then(async () => {
              const { data: freshData } = await supabase
                .from('news_items').select('*').eq('market_id', marketId)
                .order('published_at', { ascending: false }).limit(15);
              if (freshData && freshData.length > 0) {
                setNews(freshData.map(mapDbItem));
              }
            }).catch(() => {});
          }
          return;
        }
      }

      const { data: liveData, error: fnError } = await supabase.functions.invoke('fetch-market-news', { body: { marketId } });

      if (!fnError && liveData?.success && liveData.data?.length > 0) {
        setNews(liveData.data.map((item: any) => ({
          id: item?.id ?? `news-${Math.random().toString(36).slice(2)}`,
          title: item?.title || 'Untitled Story',
          sourceName: item?.sourceName || 'Industry News',
          sourceUrl: item?.sourceUrl || '',
          publishedAt: item?.publishedAt || 'Recent',
          categoryTag: item?.categoryTag || 'Industry',
          summary: item?.summary || undefined,
          imageUrl: item?.imageUrl || item?.image || undefined,
          impact: item?.impact || getImpactFromContent(item?.title || '', item?.summary),
        })));
        setLastFetched(new Date());
      } else {
        const { data: fallback } = await supabase
          .from('news_items').select('*').eq('market_id', marketId)
          .order('published_at', { ascending: false }).limit(15);

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

  // Leo sent them straight here after a lesson: open the first story for them.
  useEffect(() => {
    if (!autoOpen || autoOpened.current || isLoading || news.length === 0) return;
    autoOpened.current = true;
    openStory(news, 0);
  }, [autoOpen, isLoading, news, openStory]);

  // Quiz on article
  const handleQuiz = (item: NewsItem) => {
    triggerHaptic('medium');
    setQuizArticle(item);
  };

  const handleAiAction = (item: NewsItem, action: 'discuss' | 'summarize' | 'why') => {
    const contextMap: Record<string, string> = {
      discuss: `The user wants to discuss this ${marketId} industry news article:\n\nTitle: "${item.title}"\nSource: ${item.sourceName}\nSummary: ${item.summary ?? 'N/A'}\n\nHelp them understand the key implications.`,
      summarize: `Provide a structured 3-bullet summary of: "${item.title}" from ${item.sourceName}. Context: ${item.summary || 'N/A'}`,
      why: `Explain why this matters for ${marketId} professionals: "${item.title}". Context: ${item.summary || 'N/A'}`,
    };
    setChatContext(contextMap[action]);
    setChatNewsItem(item);
  };

  const featured = news.slice(0, Math.min(5, news.length));
  const feed = news.slice(featured.length);

  return (
    <View style={s.container}>
      {/* Loading */}
      {isLoading && (
        <View style={s.loadingContainer}>
          {[1, 2, 3].map((i) => (
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
          {featured.length > 0 && (
            <FeaturedCarousel items={featured} onSelect={(item) => {
              openStory(news, news.findIndex(n => n.id === item.id));
            }} />
          )}

          {/* Feed section label */}
          {feed.length > 0 && featured.length > 0 && (
            <View style={s.feedSectionHeader}>
              <View style={s.feedSectionLine} />
              <Text style={s.feedSectionLabel}>LATEST</Text>
              <View style={s.feedSectionLine} />
            </View>
          )}

          {/* Vertical feed */}
          <View style={s.feedList}>
            {feed.map((item, index) => (
              <NewsFeedCard
                key={item.id}
                item={item}
                index={index}
                onSelect={(item) => {
                  openStory(news, news.findIndex(n => n.id === item.id));
                }}
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

      {/* Immersive News Overlay */}
      <ImmersiveNewsOverlay
        visible={immersiveIndex >= 0}
        articles={news}
        initialIndex={immersiveIndex >= 0 ? immersiveIndex : 0}
        onClose={() => setImmersiveIndex(-1)}
        onOpenChat={(article) => {
          const ctx = `The user wants to discuss this ${marketId} industry news article:\n\nTitle: "${article.title}"\nSource: ${article.sourceName}\nSummary: ${article.summary ?? 'N/A'}\n\nHelp them understand the key implications.`;
          setChatContext(ctx);
          setChatNewsItem(article);
        }}
        onArticleView={(article) => intel.recordRead(article.id)}
        onQuiz={(article) => {
          setImmersiveIndex(-1);
          setQuizArticle(article);
        }}
        marketId={marketId}
        learningGoal={learningGoal}
      />

      {/* Quiz Modal */}
      <QuizModal
        article={quizArticle}
        marketId={marketId}
        onClose={() => setQuizArticle(null)}
      />

      {/* AI Chat overlay */}
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
const INTEL = {
  background: COLORS.intelBackground,
  surface: COLORS.intelSurface,
  surfaceRaised: COLORS.intelSurfaceRaised,
  text: COLORS.intelText,
  secondary: COLORS.intelSecondary,
  secondaryBright: 'rgba(255,255,255,0.82)',
  muted: COLORS.intelMuted,
  separator: COLORS.intelSeparator,
  glass: 'rgba(0,0,0,0.55)',
  scrim: 'rgba(0,0,0,0.38)',
};

const s = StyleSheet.create({
  container: { backgroundColor: INTEL.background },
  featuredCarousel: { marginBottom: 24, marginHorizontal: -16 },
  featuredTrack: { paddingHorizontal: 16, gap: 12 },
  featuredCard: { height: 250, borderRadius: 20, overflow: 'hidden', backgroundColor: INTEL.surface, borderWidth: 1, borderColor: COLORS.intelSeparator, ...SHADOWS.sm },
  featuredImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  featuredOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: INTEL.scrim },
  featuredContent: { ...StyleSheet.absoluteFillObject, padding: 18, justifyContent: 'flex-end' },
  featuredTopRow: { position: 'absolute', top: 16, left: 16 },
  featuredBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: INTEL.glass },
  featuredBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.textOnAccent, letterSpacing: 0.8 },
  featuredTitle: { fontSize: 22, fontWeight: '900', color: COLORS.textOnAccent, lineHeight: 27, marginBottom: 6 },
  featuredSummary: { fontSize: 12, color: INTEL.secondaryBright, lineHeight: 16, marginBottom: 8 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredSource: { fontSize: 12, color: COLORS.textOnAccent, fontWeight: '700' },
  featuredDate: { fontSize: 11, color: 'rgba(255,255,255,0.72)' },

  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 10 },
  dot: { height: 4, borderRadius: 2, backgroundColor: INTEL.text },

  feedSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  feedSectionLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: INTEL.separator },
  feedSectionLabel: { ...TYPE.overline, color: INTEL.muted, fontSize: 10 },
  feedList: { gap: 10 },

  feedCard: {
    minHeight: 142, flexDirection: 'row', backgroundColor: INTEL.surface, borderRadius: 18,
    padding: 14, gap: 14, borderWidth: 1, borderColor: COLORS.intelSeparator, ...SHADOWS.sm,
  },
  feedCardText: { flex: 1, justifyContent: 'space-between' },
  feedSource: { fontSize: 12, color: INTEL.secondary, fontWeight: '800', marginBottom: 6 },
  feedTitle: { fontSize: 16, fontWeight: '800', color: INTEL.text, lineHeight: 21 },
  feedFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  feedDate: { fontSize: 11, color: INTEL.muted },
  feedThumb: { width: 108, height: 108, borderRadius: 12, overflow: 'hidden', alignSelf: 'center', backgroundColor: INTEL.surfaceRaised },
  feedThumbImage: { width: '100%', height: '100%' },

  loadingContainer: { gap: 8 },
  skeletonCard: { padding: 14, backgroundColor: INTEL.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.intelSeparator, gap: 8 },
  skeletonLine: { height: 14, backgroundColor: INTEL.surfaceRaised, borderRadius: 7, width: '100%' },
  emptyCard: { padding: 28, backgroundColor: INTEL.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.intelSeparator, alignItems: 'center', gap: 8 },
  emptyText: { ...TYPE.body, color: INTEL.secondary, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.accentSoft, borderRadius: 20, borderWidth: 1, borderColor: COLORS.accentMedium },
  retryText: { fontSize: 13, color: COLORS.accent, fontWeight: '600' },
  lastUpdated: { fontSize: 11, color: INTEL.muted, textAlign: 'center', marginTop: 16 },
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 10, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  highImpactPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)' },
  highImpactText: { fontSize: 9, fontWeight: '700', color: '#EF4444' },
  metaSource: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  metaDate: { fontSize: 10, color: COLORS.textMuted },

  title: { ...TYPE.h1, color: COLORS.textPrimary, marginBottom: 12 },
  summary: { ...TYPE.body, color: COLORS.textSecondary, lineHeight: 24, marginBottom: 16 },

  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  sourceLinkText: { ...TYPE.bodyBold, color: COLORS.accent },

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

// ── Quiz Modal Styles ──
const qz = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: SCREEN_HEIGHT * 0.85,
    backgroundColor: COLORS.bg0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  handleRow: { alignItems: 'center', marginBottom: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  headerIcon: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.accentSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { ...TYPE.h3, color: COLORS.textPrimary },
  headerSub: { fontSize: 12, color: COLORS.textMuted },

  loadingBox: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { ...TYPE.body, color: COLORS.textMuted },

  bodyScroll: { flexShrink: 1, minHeight: 0 },
  bodyScrollContent: { paddingBottom: 8 },

  questionBox: { paddingBottom: 20 },
  qNumber: { ...TYPE.overline, color: COLORS.accent, marginBottom: 8 },
  qText: { ...TYPE.h2, color: COLORS.textPrimary, marginBottom: 20, lineHeight: 28 },

  optionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 14, marginBottom: 8,
    backgroundColor: COLORS.bg1, borderWidth: 1.5, borderColor: COLORS.borderLight,
  },
  optionSelected: { borderColor: COLORS.accent, backgroundColor: COLORS.accentSoft },
  optionCorrect: { borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.08)' },
  optionWrong: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)' },
  optionText: { ...TYPE.body, color: COLORS.textPrimary, flex: 1, paddingRight: 8 },

  explainBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    padding: 12, borderRadius: 12, backgroundColor: COLORS.accentSoft,
    borderWidth: 1, borderColor: COLORS.accentMedium, marginTop: 8, marginBottom: 12,
  },
  explainText: { ...TYPE.caption, color: COLORS.textSecondary, flex: 1, lineHeight: 18 },

  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.accent,
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  completeBox: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  completeEmoji: { fontSize: 48 },
  completeTitle: { ...TYPE.h2, color: COLORS.textPrimary },
  completeScore: { ...TYPE.body, color: COLORS.textMuted, marginBottom: 16 },
  doneBtn: {
    paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14,
    backgroundColor: COLORS.accent,
  },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
