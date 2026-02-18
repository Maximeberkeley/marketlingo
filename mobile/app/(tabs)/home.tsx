import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../lib/constants';
import { getMarketEmoji, getMarketName } from '../../lib/markets';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useUserProgress } from '../../hooks/useUserProgress';
import { useUserXP, XP_REWARDS, STARTUP_STAGES } from '../../hooks/useUserXP';
import { StackWithSlides } from '../../lib/types';
import { LeoCharacter } from '../../components/mascot/LeoCharacter';
import { StreakBadge } from '../../components/ui/StreakBadge';
import { XPBadge } from '../../components/ui/XPBadge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LessonCard } from '../../components/ui/LessonCard';
import { SlideReader } from '../../components/slides/SlideReader';

// Market-specific hero images mapped by market ID
const marketHeroImages: Record<string, any> = {
  aerospace: require('../../assets/markets/aerospace-hero.jpg'),
  neuroscience: require('../../assets/markets/neuroscience-hero.jpg'),
  ai: require('../../assets/markets/ai-hero.jpg'),
  fintech: require('../../assets/markets/fintech-hero.jpg'),
  ev: require('../../assets/markets/ev-hero.jpg'),
  biotech: require('../../assets/markets/biotech-hero.jpg'),
  cleanenergy: require('../../assets/markets/cleanenergy-hero.jpg'),
  agtech: require('../../assets/markets/agtech-hero.jpg'),
  climatetech: require('../../assets/markets/climatetech-hero.jpg'),
  cybersecurity: require('../../assets/markets/cybersecurity-hero.jpg'),
  spacetech: require('../../assets/markets/spacetech-hero.jpg'),
  robotics: require('../../assets/markets/robotics-hero.jpg'),
  healthtech: require('../../assets/markets/healthtech-hero.jpg'),
  logistics: require('../../assets/markets/logistics-hero.jpg'),
  web3: require('../../assets/markets/web3-hero.jpg'),
};

// Color scheme per market
const marketColorScheme: Record<string, 'purple' | 'blue' | 'green' | 'amber' | 'emerald' | 'rose'> = {
  aerospace: 'purple',
  neuroscience: 'rose',
  ai: 'blue',
  fintech: 'emerald',
  ev: 'blue',
  biotech: 'rose',
  cleanenergy: 'amber',
  agtech: 'green',
  climatetech: 'emerald',
  cybersecurity: 'rose',
  spacetech: 'purple',
  robotics: 'amber',
  healthtech: 'blue',
  logistics: 'amber',
  web3: 'purple',
};

interface NewsItem {
  id: string;
  title: string;
  summary: string | null;
  source_name: string;
  source_url: string;
  published_at: string;
  category_tag: string | null;
}

interface KeyPlayer {
  id: string;
  name: string;
  ticker?: string;
  logo: string;
  segment: string;
}

// Key players per market (top 6 for quick display)
const MARKET_KEY_PLAYERS: Record<string, KeyPlayer[]> = {
  aerospace: [
    { id: 'boeing', name: 'Boeing', ticker: 'BA', logo: '✈️', segment: 'commercial' },
    { id: 'airbus', name: 'Airbus', ticker: 'EADSY', logo: '🛩️', segment: 'commercial' },
    { id: 'lockheed', name: 'Lockheed Martin', ticker: 'LMT', logo: '🛡️', segment: 'defense' },
    { id: 'spacex', name: 'SpaceX', logo: '🚀', segment: 'space' },
    { id: 'raytheon', name: 'RTX', ticker: 'RTX', logo: '🎯', segment: 'defense' },
    { id: 'ge', name: 'GE Aerospace', ticker: 'GE', logo: '⚙️', segment: 'propulsion' },
  ],
  ai: [
    { id: 'openai', name: 'OpenAI', logo: '🤖', segment: 'models' },
    { id: 'anthropic', name: 'Anthropic', logo: '🧠', segment: 'models' },
    { id: 'google', name: 'Google DeepMind', ticker: 'GOOGL', logo: '🔍', segment: 'models' },
    { id: 'nvidia', name: 'NVIDIA', ticker: 'NVDA', logo: '💻', segment: 'hardware' },
    { id: 'microsoft', name: 'Microsoft', ticker: 'MSFT', logo: '🖥️', segment: 'enterprise' },
    { id: 'mistral', name: 'Mistral AI', logo: '🌪️', segment: 'models' },
  ],
  fintech: [
    { id: 'stripe', name: 'Stripe', logo: '💳', segment: 'payments' },
    { id: 'plaid', name: 'Plaid', logo: '🏦', segment: 'infrastructure' },
    { id: 'robinhood', name: 'Robinhood', ticker: 'HOOD', logo: '📈', segment: 'investing' },
    { id: 'affirm', name: 'Affirm', ticker: 'AFRM', logo: '💰', segment: 'lending' },
    { id: 'chime', name: 'Chime', logo: '🔔', segment: 'neobank' },
    { id: 'square', name: 'Block', ticker: 'SQ', logo: '⬛', segment: 'payments' },
  ],
  biotech: [
    { id: 'moderna', name: 'Moderna', ticker: 'MRNA', logo: '💉', segment: 'therapeutics' },
    { id: 'illumina', name: 'Illumina', ticker: 'ILMN', logo: '🔬', segment: 'devices' },
    { id: 'crispr', name: 'CRISPR Therapeutics', ticker: 'CRSP', logo: '✂️', segment: 'therapeutics' },
    { id: 'vertex', name: 'Vertex', ticker: 'VRTX', logo: '🧬', segment: 'pharma' },
    { id: 'regeneron', name: 'Regeneron', ticker: 'REGN', logo: '🦋', segment: 'pharma' },
    { id: 'recursion', name: 'Recursion', ticker: 'RXRX', logo: '🤖', segment: 'therapeutics' },
  ],
  ev: [
    { id: 'tesla', name: 'Tesla', ticker: 'TSLA', logo: '⚡', segment: 'oem' },
    { id: 'rivian', name: 'Rivian', ticker: 'RIVN', logo: '🚚', segment: 'oem' },
    { id: 'lucid', name: 'Lucid Motors', ticker: 'LCID', logo: '🚗', segment: 'oem' },
    { id: 'byd', name: 'BYD', ticker: 'BYDDY', logo: '🔋', segment: 'oem' },
    { id: 'chargepoint', name: 'ChargePoint', ticker: 'CHPT', logo: '🔌', segment: 'charging' },
    { id: 'quantumscape', name: 'QuantumScape', ticker: 'QS', logo: '⚛️', segment: 'battery' },
  ],
  neuroscience: [
    { id: 'neuralink', name: 'Neuralink', logo: '🧠', segment: 'devices' },
    { id: 'synchron', name: 'Synchron', logo: '💡', segment: 'devices' },
    { id: 'mindmaze', name: 'MindMaze', logo: '🎮', segment: 'therapeutics' },
    { id: 'kernel', name: 'Kernel', logo: '🖥️', segment: 'devices' },
    { id: 'emotiv', name: 'Emotiv', logo: '🎭', segment: 'devices' },
    { id: 'compass', name: 'Compass Pathways', ticker: 'CMPS', logo: '🧪', segment: 'pharma' },
  ],
  cleanenergy: [
    { id: 'nextera', name: 'NextEra Energy', ticker: 'NEE', logo: '☀️', segment: 'utilities' },
    { id: 'firstsolar', name: 'First Solar', ticker: 'FSLR', logo: '🌞', segment: 'solar' },
    { id: 'enphase', name: 'Enphase', ticker: 'ENPH', logo: '⚡', segment: 'solar' },
    { id: 'bloom', name: 'Bloom Energy', ticker: 'BE', logo: '🔋', segment: 'storage' },
    { id: 'vestas', name: 'Vestas', ticker: 'VWS.CO', logo: '💨', segment: 'wind' },
    { id: 'sunrun', name: 'Sunrun', ticker: 'RUN', logo: '🏠', segment: 'solar' },
  ],
  spacetech: [
    { id: 'spacex', name: 'SpaceX', logo: '🚀', segment: 'launch' },
    { id: 'rocketlab', name: 'Rocket Lab', ticker: 'RKLB', logo: '🛸', segment: 'launch' },
    { id: 'planet', name: 'Planet Labs', ticker: 'PL', logo: '🌍', segment: 'satellites' },
    { id: 'maxar', name: 'Maxar Technologies', logo: '📡', segment: 'satellites' },
    { id: 'axiom', name: 'Axiom Space', logo: '🏗️', segment: 'stations' },
    { id: 'astra', name: 'Astra', ticker: 'ASTR', logo: '⭐', segment: 'launch' },
  ],
  cybersecurity: [
    { id: 'crowdstrike', name: 'CrowdStrike', ticker: 'CRWD', logo: '🦅', segment: 'edr' },
    { id: 'paloalto', name: 'Palo Alto Networks', ticker: 'PANW', logo: '🔥', segment: 'network' },
    { id: 'sentinelone', name: 'SentinelOne', ticker: 'S', logo: '👁️', segment: 'edr' },
    { id: 'zscaler', name: 'Zscaler', ticker: 'ZS', logo: '☁️', segment: 'cloud' },
    { id: 'okta', name: 'Okta', ticker: 'OKTA', logo: '🔑', segment: 'iam' },
    { id: 'wiz', name: 'Wiz', logo: '🧙', segment: 'cloud' },
  ],
  healthtech: [
    { id: 'teladoc', name: 'Teladoc', ticker: 'TDOC', logo: '📱', segment: 'telemedicine' },
    { id: 'doximity', name: 'Doximity', ticker: 'DOCS', logo: '👨‍⚕️', segment: 'platforms' },
    { id: 'hims', name: 'Hims & Hers', ticker: 'HIMS', logo: '💊', segment: 'dtc' },
    { id: 'veeva', name: 'Veeva Systems', ticker: 'VEEV', logo: '☁️', segment: 'infrastructure' },
    { id: 'inspire', name: 'Inspire Medical', ticker: 'INSP', logo: '😴', segment: 'devices' },
    { id: 'proteus', name: 'Proteus Digital', logo: '💉', segment: 'diagnostics' },
  ],
  robotics: [
    { id: 'boston', name: 'Boston Dynamics', logo: '🦾', segment: 'humanoid' },
    { id: 'fanuc', name: 'FANUC', ticker: '6954.T', logo: '🏭', segment: 'industrial' },
    { id: 'intuitive', name: 'Intuitive Surgical', ticker: 'ISRG', logo: '🔬', segment: 'surgical' },
    { id: 'berkshire', name: 'ABB Robotics', ticker: 'ABB', logo: '⚙️', segment: 'industrial' },
    { id: 'figure', name: 'Figure AI', logo: '🤖', segment: 'humanoid' },
    { id: 'agility', name: 'Agility Robotics', logo: '🚶', segment: 'humanoid' },
  ],
  agtech: [
    { id: 'deere', name: 'John Deere', ticker: 'DE', logo: '🚜', segment: 'equipment' },
    { id: 'bayer', name: 'Bayer Crop Science', ticker: 'BAYRY', logo: '🌾', segment: 'seeds' },
    { id: 'trimble', name: 'Trimble', ticker: 'TRMB', logo: '📡', segment: 'precision' },
    { id: 'climate', name: 'The Climate Corp.', logo: '🌦️', segment: 'data' },
    { id: 'bowery', name: 'Bowery Farming', logo: '🌿', segment: 'indoor' },
    { id: 'pivot', name: 'Pivot Bio', logo: '🦠', segment: 'biologicals' },
  ],
  climatetech: [
    { id: 'climeworks', name: 'Climeworks', logo: '💨', segment: 'dac' },
    { id: 'carbon', name: 'Carbon Engineering', logo: '🏭', segment: 'dac' },
    { id: 'clear', name: 'ClearPath Energy', logo: '☁️', segment: 'projects' },
    { id: 'watershed', name: 'Watershed', logo: '💧', segment: 'software' },
    { id: 'charm', name: 'Charm Industrial', logo: '⚗️', segment: 'cdr' },
    { id: 'heirloom', name: 'Heirloom Carbon', logo: '♻️', segment: 'dac' },
  ],
  logistics: [
    { id: 'flexport', name: 'Flexport', logo: '📦', segment: 'freight' },
    { id: 'project44', name: 'project44', logo: '📡', segment: 'visibility' },
    { id: 'samsara', name: 'Samsara', ticker: 'IOT', logo: '🚛', segment: 'fleet' },
    { id: 'stord', name: 'Stord', logo: '🏪', segment: 'warehousing' },
    { id: 'locus', name: 'Locus Robotics', logo: '🤖', segment: 'warehouse' },
    { id: 'turvo', name: 'Turvo', logo: '🔄', segment: 'tms' },
  ],
  web3: [
    { id: 'coinbase', name: 'Coinbase', ticker: 'COIN', logo: '🪙', segment: 'exchange' },
    { id: 'opensea', name: 'OpenSea', logo: '🌊', segment: 'nfts' },
    { id: 'uniswap', name: 'Uniswap', logo: '🦄', segment: 'defi' },
    { id: 'alchemy', name: 'Alchemy', logo: '⚗️', segment: 'infrastructure' },
    { id: 'chainalysis', name: 'Chainalysis', logo: '🔍', segment: 'compliance' },
    { id: 'polygon', name: 'Polygon', logo: '🔷', segment: 'l2' },
  ],
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading } = useAuth();
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [isProUser, setIsProUser] = useState(false);
  const { progress, availableDay, completeStack, updateStreak } = useUserProgress(selectedMarket || undefined);
  const {
    xpData,
    completeLessonForToday,
    getCurrentStage,
    getProgressToNextStage,
    isLessonCompletedToday,
    addXP,
  } = useUserXP(selectedMarket || undefined);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lessonStack, setLessonStack] = useState<StackWithSlides | null>(null);
  const [newsStack, setNewsStack] = useState<StackWithSlides | null>(null);
  const [activeStack, setActiveStack] = useState<StackWithSlides | null>(null);
  const [showReader, setShowReader] = useState(false);
  const [leoMessage, setLeoMessage] = useState('');
  const [leoAnimation, setLeoAnimation] = useState<'idle' | 'waving' | 'success' | 'celebrating'>('idle');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [keyPlayers, setKeyPlayers] = useState<KeyPlayer[]>([]);

  const lessonCompletedToday = isLessonCompletedToday();
  const currentStage = getCurrentStage();
  const stageProgress = getProgressToNextStage();
  const streak = progress?.current_streak || 0;
  const currentDay = availableDay;

  useEffect(() => {
    const hour = new Date().getHours();
    let greeting = '';
    let anim: 'idle' | 'waving' | 'success' | 'celebrating' = 'idle';

    if (hour < 12) { greeting = 'Good morning! Ready to learn? ☀️'; anim = 'waving'; }
    else if (hour < 17) { greeting = "Good afternoon! Let's keep going! 🚀"; anim = 'idle'; }
    else { greeting = 'Evening study session! 🌙'; anim = 'idle'; }

    if (streak >= 7) { greeting = `${streak} day streak! You're on fire! 🔥`; anim = 'celebrating'; }
    else if (lessonCompletedToday) { greeting = 'Lesson done! Try a game? 🎮'; anim = 'success'; }

    setLeoMessage(greeting);
    setLeoAnimation(anim);
  }, [streak, lessonCompletedToday]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('selected_market, familiarity_level, is_pro_user')
      .eq('id', user.id)
      .single();

    if (!profile?.selected_market) {
      router.replace('/onboarding');
      return;
    }
    if (!profile?.familiarity_level) {
      router.replace('/onboarding/familiarity');
      return;
    }

    setSelectedMarket(profile.selected_market);
    setIsProUser(profile.is_pro_user || false);
    const market = profile.selected_market;

    // Set key players for the market
    setKeyPlayers(MARKET_KEY_PLAYERS[market] || MARKET_KEY_PLAYERS.aerospace);

    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('start_date')
      .eq('user_id', user.id)
      .eq('market_id', market)
      .single();

    let calcDay = 1;
    if (userProgress?.start_date) {
      const start = new Date(userProgress.start_date);
      const today = new Date();
      start.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      calcDay = Math.min(180, Math.max(1, diffDays + 1));
    }
    const dayTag = `day-${calcDay}`;

    let { data: lessonStacks } = await supabase
      .from('stacks')
      .select('id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)')
      .eq('market_id', market)
      .contains('tags', ['MICRO_LESSON', dayTag])
      .not('published_at', 'is', null)
      .limit(1);

    if (!lessonStacks?.[0]) {
      const { data: allLessons } = await supabase
        .from('stacks')
        .select('id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)')
        .eq('market_id', market)
        .contains('tags', ['MICRO_LESSON'])
        .not('published_at', 'is', null);

      if (allLessons?.length) {
        const lessonsWithDays = allLessons.map((stack: any) => {
          const dayMatch = (stack.tags as string[])?.find((t: string) => t.startsWith('day-'));
          const dayNum = dayMatch ? parseInt(dayMatch.replace('day-', ''), 10) : 999;
          return { ...stack, dayNum };
        });
        const validLessons = lessonsWithDays.filter((l: any) => l.dayNum <= calcDay);
        const selectedLesson = validLessons.length > 0
          ? validLessons.reduce((max: any, l: any) => (l.dayNum > max.dayNum ? l : max))
          : lessonsWithDays.reduce((min: any, l: any) => (l.dayNum < min.dayNum ? l : min));
        lessonStacks = [selectedLesson];
      }
    }

    if (lessonStacks?.[0]) {
      const stack = lessonStacks[0] as any;
      setLessonStack({
        ...stack,
        tags: stack.tags || [],
        slides: ((stack.slides as any[]) || [])
          .sort((a: any, b: any) => a.slide_number - b.slide_number)
          .map((s: any) => ({ ...s, sources: Array.isArray(s.sources) ? s.sources : [] })),
      });
    }

    const { data: newsStacks } = await supabase
      .from('stacks')
      .select('id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)')
      .eq('market_id', market)
      .contains('tags', ['DAILY_GAME'])
      .not('published_at', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1);

    if (newsStacks?.[0]) {
      const stack = newsStacks[0] as any;
      setNewsStack({
        ...stack,
        tags: stack.tags || [],
        slides: ((stack.slides as any[]) || [])
          .sort((a: any, b: any) => a.slide_number - b.slide_number)
          .map((s: any) => ({ ...s, sources: Array.isArray(s.sources) ? s.sources : [] })),
      });
    }

    const { data: fetchedNews } = await supabase
      .from('news_items')
      .select('id, title, summary, source_name, source_url, published_at, category_tag')
      .eq('market_id', market)
      .order('published_at', { ascending: false })
      .limit(5);

    if (fetchedNews) setNewsItems(fetchedNews);

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleStackComplete = async (isReviewMode: boolean, timeSpentSeconds: number) => {
    setShowReader(false);
    if (isReviewMode) {
      Alert.alert('Great review!', 'Keep up the good work.');
      return;
    }
    if (timeSpentSeconds < 180) {
      Alert.alert('Keep learning!', 'Spend at least 3 minutes to complete the lesson.');
      return;
    }
    if (progress && activeStack) {
      await completeStack(activeStack.id);
      await updateStreak();
      await completeLessonForToday(activeStack.id);
      if ((progress.current_streak || 0) > 0) {
        await addXP(XP_REWARDS.STREAK_BONUS * (progress.current_streak || 1), 'streak_bonus');
      }
    }
    Alert.alert('Lesson complete! 🔥', 'Great job! Try some drills to practice.');
    router.push('/(tabs)/home');
  };

  const handleOpenStack = (stack: StackWithSlides) => {
    setActiveStack(stack);
    setShowReader(true);
  };

  const handleSaveInsight = async (slideNum: number) => {
    if (!user || !activeStack) return;
    const slide = activeStack.slides[slideNum - 1];
    await supabase.from('saved_insights').insert({
      user_id: user.id,
      title: slide?.title || 'Insight',
      content: slide?.body,
      stack_id: activeStack.id,
    });
    Alert.alert('Saved!', 'Insight saved to your notebook.');
  };

  const handleAddNote = async (slideNum: number) => {
    if (!user || !activeStack || !selectedMarket) return;
    const slide = activeStack.slides.find((s) => s.slide_number === slideNum);
    await supabase.from('notes').insert({
      user_id: user.id,
      content: slide?.body || '',
      linked_label: `Slide ${slideNum}`,
      stack_id: activeStack.id,
      market_id: selectedMarket,
    });
    Alert.alert('Note added!', 'Note saved to your notebook.');
  };

  if (loading || authLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const heroImage = selectedMarket ? marketHeroImages[selectedMarket] : marketHeroImages.aerospace;
  const colorScheme = selectedMarket ? (marketColorScheme[selectedMarket] || 'purple') : 'purple';

  return (
    <View style={styles.container}>
      {showReader && activeStack ? (
        <SlideReader
          stackTitle={activeStack.title}
          stackType={activeStack.stack_type as 'NEWS' | 'HISTORY' | 'LESSON'}
          slides={activeStack.slides.map((s) => ({
            slideNumber: s.slide_number,
            title: s.title,
            body: s.body,
            sources: s.sources,
          }))}
          onClose={() => setShowReader(false)}
          onComplete={handleStackComplete}
          onSaveInsight={handleSaveInsight}
          onAddNote={handleAddNote}
          marketId={selectedMarket || undefined}
          isReview={lessonCompletedToday && activeStack.stack_type === 'LESSON'}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.industryEmoji}>{getMarketEmoji(selectedMarket || 'aerospace')}</Text>
              <View>
                <Text style={styles.industryName}>{getMarketName(selectedMarket || 'aerospace')}</Text>
                <Text style={styles.dayText}>Day {currentDay} of 180</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <XPBadge xp={xpData?.total_xp || 0} level={xpData?.current_level || 1} />
              <StreakBadge count={streak} />
            </View>
          </View>

          {/* Leo Greeting */}
          <View style={styles.leoSection}>
            <LeoCharacter size="lg" animation={leoAnimation} />
            <Text style={styles.leoMessage}>{leoMessage}</Text>
          </View>

          {/* Startup Progress */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.progressLeft}>
                <Text style={styles.crownEmoji}>👑</Text>
                <Text style={styles.progressTitle}>
                  Stage {currentStage.stage}: {currentStage.name}
                </Text>
              </View>
              <Text style={styles.progressPercent}>{Math.round(stageProgress)}%</Text>
            </View>
            <ProgressBar progress={stageProgress} />
          </View>

          {/* TODAY'S LEARNING */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TODAY'S LEARNING</Text>

            {lessonCompletedToday ? (
              <View style={styles.completedCard}>
                <View style={styles.completedHeader}>
                  <View style={styles.completedIcon}>
                    <Text style={styles.completedCheckmark}>✓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedTitle}>Lesson Complete! 🎉</Text>
                    <Text style={styles.completedXP}>⚡ +{XP_REWARDS.LESSON_COMPLETE} XP earned</Text>
                  </View>
                </View>
                <View style={styles.completedActions}>
                  <TouchableOpacity
                    style={styles.reviewButton}
                    onPress={() => lessonStack && handleOpenStack(lessonStack)}
                  >
                    <Text style={styles.reviewButtonText}>Review</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.practiceButton}
                    onPress={() => router.push('/drills' as any)}
                  >
                    <Text style={styles.practiceButtonText}>⚡ Practice</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              lessonStack && (
                <LessonCard
                  title="Micro Lesson"
                  subtitle="Today's Lesson"
                  headline={lessonStack.title}
                  xp={XP_REWARDS.LESSON_COMPLETE}
                  duration={lessonStack.duration_minutes || 5}
                  colorScheme={colorScheme}
                  imageSrc={heroImage}
                  onClick={() => handleOpenStack(lessonStack)}
                />
              )
            )}

            {newsStack && (
              <LessonCard
                title="Daily Pattern"
                subtitle="Industry Insight"
                headline={newsStack.title}
                xp={25}
                duration={newsStack.duration_minutes || 3}
                colorScheme="blue"
                onClick={() => handleOpenStack(newsStack)}
              />
            )}
          </View>

          {/* PRACTICE & PLAY */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRACTICE & PLAY</Text>
            <View style={styles.activityGrid}>
              <TouchableOpacity
                style={[styles.activityCard, { borderColor: 'rgba(139, 92, 246, 0.3)' }]}
                onPress={() => router.push('/games' as any)}
              >
                <Text style={styles.activityEmoji}>🎮</Text>
                <Text style={[styles.activityTag, { color: '#A78BFA' }]}>TRIVIA</Text>
                <Text style={styles.activityTitle}>Games</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.activityCard, { borderColor: 'rgba(245, 158, 11, 0.3)' }]}
                onPress={() => router.push('/drills' as any)}
              >
                <Text style={styles.activityEmoji}>⚡</Text>
                <Text style={[styles.activityTag, { color: '#FBBF24' }]}>SPEED</Text>
                <Text style={styles.activityTitle}>Drills</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.trainerCard}
              onPress={() => router.push('/trainer' as any)}
            >
              <View>
                <Text style={[styles.activityTag, { color: '#4ADE80' }]}>STRATEGY</Text>
                <Text style={styles.activityTitle}>Trainer Scenarios</Text>
              </View>
              <Text style={styles.chevron}>→</Text>
            </TouchableOpacity>
          </View>

          {/* Investment Lab Teaser */}
          <TouchableOpacity
            style={[
              styles.investmentLabCard,
              isProUser
                ? { borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.06)' }
                : { borderColor: 'rgba(139, 92, 246, 0.2)', backgroundColor: 'rgba(139, 92, 246, 0.04)' },
            ]}
            onPress={() => router.push('/investment-lab' as any)}
          >
            <View style={[styles.investmentLabIcon, isProUser ? { backgroundColor: 'rgba(16, 185, 129, 0.2)' } : { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
              <Text style={{ fontSize: 20 }}>{isProUser ? '📈' : '🔒'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.investmentLabHeader}>
                <Text style={styles.investmentLabTitle}>Investment Lab</Text>
                {isProUser ? (
                  <View style={styles.bonusBadge}><Text style={styles.bonusBadgeText}>BONUS</Text></View>
                ) : (
                  <View style={styles.proBadge}><Text style={styles.proBadgeText}>👑 PRO</Text></View>
                )}
              </View>
              <Text style={styles.investmentLabSubtitle}>
                {isProUser ? 'Become investment-ready' : 'Unlock with Pro'}
              </Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>

          {/* QUICK ACCESS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUICK ACCESS</Text>
            <View style={styles.quickGrid}>
              {[
                { emoji: '📓', label: 'Notes', route: '/(tabs)/notebook' },
                { emoji: '🏆', label: 'Rank', route: '/leaderboard' },
                { emoji: '🏅', label: 'Badges', route: '/achievements' },
                { emoji: '📰', label: 'News', route: '/summaries' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={styles.quickCard}
                  onPress={() => router.push(item.route as any)}
                >
                  <Text style={styles.quickEmoji}>{item.emoji}</Text>
                  <Text style={styles.quickLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* KEY PLAYERS */}
          {keyPlayers.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <Text style={styles.sectionHeaderIcon}>🏢</Text>
                  <Text style={styles.sectionHeaderTitle}>Key Players</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{keyPlayers.length}</Text>
                  </View>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingRight: 4 }}
              >
                {keyPlayers.map((player) => (
                  <TouchableOpacity key={player.id} style={styles.playerCard}>
                    <View style={styles.playerLogoContainer}>
                      <Text style={styles.playerLogo}>{player.logo}</Text>
                    </View>
                    <Text style={styles.playerName} numberOfLines={2}>{player.name}</Text>
                    {player.ticker && <Text style={styles.playerTicker}>${player.ticker}</Text>}
                    <View style={styles.playerSegmentBadge}>
                      <Text style={styles.playerSegmentText}>{player.segment}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* INDUSTRY INTEL (News Feed) */}
          {newsItems.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <View style={styles.liveDot} />
                  <Text style={styles.sectionHeaderTitle}>Industry Intel</Text>
                  <View style={[styles.countBadge, { backgroundColor: 'rgba(139,92,246,0.15)' }]}>
                    <Text style={[styles.countBadgeText, { color: COLORS.accent }]}>LIVE</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => router.push('/summaries' as any)}>
                  <Text style={styles.seeAllText}>See all →</Text>
                </TouchableOpacity>
              </View>
              <View style={{ gap: 8 }}>
                {newsItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.newsCard}
                    onPress={() => {
                      if (item.source_url) Linking.openURL(item.source_url).catch(() => {});
                    }}
                  >
                    <View style={styles.newsCardHeader}>
                      <View style={styles.newsSourceBadge}>
                        <Text style={styles.newsSource}>{item.source_name}</Text>
                      </View>
                      {item.category_tag && (
                        <View style={styles.newsCategoryBadge}>
                          <Text style={styles.newsCategory}>{item.category_tag}</Text>
                        </View>
                      )}
                      <Text style={styles.newsDate}>
                        {new Date(item.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                    {item.summary && (
                      <View style={styles.newsSummaryBox}>
                        <Text style={styles.newsSummaryLabel}>✨ AI Summary</Text>
                        <Text style={styles.newsSummary} numberOfLines={2}>{item.summary}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg0 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  industryEmoji: { fontSize: 28 },
  industryName: { fontSize: 17, fontWeight: '600', color: COLORS.textPrimary },
  dayText: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  leoSection: { alignItems: 'center', marginBottom: 16 },
  leoMessage: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 },
  progressCard: {
    backgroundColor: COLORS.bg2, borderRadius: 16, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  progressLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  crownEmoji: { fontSize: 16 },
  progressTitle: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  progressPercent: { fontSize: 13, fontWeight: '700', color: COLORS.accent },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1, marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeaderIcon: { fontSize: 16 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  countBadge: {
    backgroundColor: COLORS.bg2, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  countBadgeText: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted },
  liveDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent,
  },
  seeAllText: { fontSize: 12, color: COLORS.accent },
  completedCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  completedHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  completedIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center',
  },
  completedCheckmark: { fontSize: 22, color: '#FFFFFF', fontWeight: '700' },
  completedTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  completedXP: { fontSize: 13, color: '#34D399', marginTop: 2 },
  completedActions: { flexDirection: 'row', gap: 10 },
  reviewButton: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  reviewButtonText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '500' },
  practiceButton: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: COLORS.accent, alignItems: 'center',
  },
  practiceButtonText: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  activityGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  activityCard: {
    flex: 1, backgroundColor: COLORS.bg2, borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1,
  },
  activityEmoji: { fontSize: 28, marginBottom: 6 },
  activityTag: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  activityTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginTop: 2 },
  trainerCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.bg2, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.3)',
  },
  investmentLabCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 14, marginBottom: 20,
    borderWidth: 1,
  },
  investmentLabIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  investmentLabHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  investmentLabTitle: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  investmentLabSubtitle: { fontSize: 11, color: COLORS.textMuted },
  bonusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  bonusBadgeText: { fontSize: 8, fontWeight: '700', color: '#34D399' },
  proBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  proBadgeText: { fontSize: 8, fontWeight: '700', color: COLORS.accent },
  quickGrid: { flexDirection: 'row', gap: 8 },
  quickCard: {
    flex: 1, backgroundColor: COLORS.bg2, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 6,
  },
  quickEmoji: { fontSize: 22 },
  quickLabel: { fontSize: 11, fontWeight: '500', color: COLORS.textSecondary },
  chevron: { fontSize: 20, color: COLORS.textMuted },
  // Key Players
  playerCard: {
    width: 120, backgroundColor: COLORS.bg2, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  playerLogoContainer: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.bg1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  playerLogo: { fontSize: 24 },
  playerName: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 2 },
  playerTicker: { fontSize: 10, color: COLORS.accent, marginBottom: 6 },
  playerSegmentBadge: {
    backgroundColor: 'rgba(139,92,246,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  playerSegmentText: { fontSize: 8, fontWeight: '600', color: COLORS.accent, textTransform: 'uppercase' },
  // News Cards
  newsCard: {
    backgroundColor: COLORS.bg2, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  newsCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  newsSourceBadge: {
    backgroundColor: COLORS.bg1, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  newsSource: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  newsCategoryBadge: {
    backgroundColor: 'rgba(139,92,246,0.15)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  newsCategory: { fontSize: 9, fontWeight: '600', color: COLORS.accent, textTransform: 'uppercase', letterSpacing: 0.3 },
  newsDate: { fontSize: 10, color: COLORS.textMuted, marginLeft: 'auto' },
  newsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 20, marginBottom: 8 },
  newsSummaryBox: {
    backgroundColor: 'rgba(139,92,246,0.06)', borderRadius: 8, padding: 10,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.15)',
  },
  newsSummaryLabel: { fontSize: 10, fontWeight: '600', color: COLORS.accent, marginBottom: 4 },
  newsSummary: { fontSize: 11, color: COLORS.textSecondary, lineHeight: 16 },
});
