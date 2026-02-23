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
  Image,
} from 'react-native';
import { KeyPlayers } from '../../components/home/KeyPlayers';
import { DailyNews } from '../../components/home/DailyNews';
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
import { MentorChatOverlay } from '../../components/ai/MentorChatOverlay';
import { getMentorForContext, Mentor } from '../../data/mentors';
import { getPrimaryMentorForMarket } from '../../data/marketConfig';
import { TodaysMission } from '../../components/home/TodaysMission';
import { StreakAtRisk, getStreakRiskHours } from '../../components/home/StreakAtRisk';
import { SessionCompleteCard } from '../../components/home/SessionCompleteCard';
import { SocialNudge } from '../../components/home/SocialNudge';
import { TomorrowPreview } from '../../components/home/TomorrowPreview';
import { MentorDebrief, getDebriefQuestion } from '../../components/home/MentorDebrief';
import { scheduleStreakNotifications } from '../../lib/streakNotifications';
import { MilestoneShareCard } from '../../components/sharing/MilestoneShareCard';

const MENTOR_IMAGES: Record<string, any> = {
  maya: require('../../assets/mentors/mentor-maya.png'),
  alex: require('../../assets/mentors/mentor-alex.png'),
  kai: require('../../assets/mentors/mentor-kai.png'),
  sophia: require('../../assets/mentors/mentor-sophia.png'),
};

// Market-to-mentor mapping
const MARKET_PRIMARY_MENTOR: Record<string, string> = {
  aerospace: 'maya',
  neuroscience: 'sophia',
  ai: 'alex',
  fintech: 'kai',
  ev: 'alex',
  biotech: 'sophia',
  cleanenergy: 'maya',
  agtech: 'kai',
  climatetech: 'maya',
  cybersecurity: 'alex',
  spacetech: 'alex',
  robotics: 'alex',
  healthtech: 'sophia',
  logistics: 'kai',
  web3: 'kai',
};

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

// Normalize sources — DB has mixed formats: plain URL strings or {label, url} objects
function normalizeSources(sources: any): { label: string; url: string }[] {
  if (!Array.isArray(sources)) return [];
  return sources.map((s: any) => {
    if (typeof s === 'string') {
      // Plain URL string — extract domain as label
      try {
        const url = new URL(s);
        return { label: url.hostname.replace('www.', ''), url: s };
      } catch {
        return { label: 'Source', url: s };
      }
    }
    if (s && typeof s === 'object' && s.url) {
      return { label: s.label || s.url, url: s.url };
    }
    return null;
  }).filter(Boolean) as { label: string; url: string }[];
}

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
  const [newsRefreshing, setNewsRefreshing] = useState(false);
  const [keyPlayers, setKeyPlayers] = useState<KeyPlayer[]>([]);
  const [mentorChatVisible, setMentorChatVisible] = useState(false);
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);
  // Retention feature state
  const [showSessionComplete, setShowSessionComplete] = useState(false);
  const [sessionXPEarned, setSessionXPEarned] = useState(0);
  const [streakRiskHours, setStreakRiskHours] = useState<number | null>(null);
  const [showStreakWarning, setShowStreakWarning] = useState(true);
  const [socialNudge, setSocialNudge] = useState<{ name: string; xp: number } | null>(null);
  const [showSocialNudge, setShowSocialNudge] = useState(true);
  const [tomorrowLesson, setTomorrowLesson] = useState<{ title: string; dayNumber: number } | null>(null);
  const [showMentorDebrief, setShowMentorDebrief] = useState(true);
  const [mentorChatContext, setMentorChatContext] = useState<string>('');

  const { milestone, dismissMilestone, checkStreakMilestone, checkLevelMilestone, showStageUp } = useMilestoneSharing();
  const lessonCompletedToday = isLessonCompletedToday();
  const currentStage = getCurrentStage();
  const stageProgress = getProgressToNextStage();
  const streak = progress?.current_streak || 0;
  const currentDay = availableDay;

  const handleOpenMentorChat = (context?: string) => {
    const mentor = getMentorForContext('strategy', selectedMarket || 'aerospace');
    setActiveMentor(mentor);
    if (context) setMentorChatContext(context);
    setMentorChatVisible(true);
  };

  const handleOpenMentorForLesson = () => {
    const lessonTitle = activeStack?.title || lessonStack?.title || 'today\'s lesson';
    const context = `The user just completed the lesson "${lessonTitle}" (Day ${currentDay}) in the ${getMarketName(selectedMarket || 'aerospace')} market. Help them reflect on what they learned, answer questions about the content, and connect it to real-world applications. Be conversational and encouraging.`;
    handleOpenMentorChat(context);
  };

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

    // Get learning goal for content filtering
    const { data: userProgress } = await supabase
      .from('user_progress')
      .select('start_date, learning_goal')
      .eq('user_id', user.id)
      .eq('market_id', market)
      .single();

    const learningGoal = userProgress?.learning_goal || 'curiosity';
    const goalTag = `goal:${learningGoal}`;

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

    // Fetch goal-specific content first, fallback to any
    let { data: lessonStacks } = await supabase
      .from('stacks')
      .select('id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)')
      .eq('market_id', market)
      .contains('tags', ['MICRO_LESSON', dayTag, goalTag])
      .not('published_at', 'is', null)
      .limit(1);

    // Fallback: without goal tag (legacy content)
    if (!lessonStacks?.[0]) {
      const { data: fallback } = await supabase
        .from('stacks')
        .select('id, title, stack_type, tags, duration_minutes, slides (slide_number, title, body, sources)')
        .eq('market_id', market)
        .contains('tags', ['MICRO_LESSON', dayTag])
        .not('published_at', 'is', null)
        .limit(1);
      lessonStacks = fallback;
    }

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
          .map((s: any) => ({ ...s, sources: normalizeSources(s.sources) })),
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
          .map((s: any) => ({ ...s, sources: normalizeSources(s.sources) })),
      });
    }

    // Fetch news — try DB first, then call edge function if empty
    const { data: cachedNews } = await supabase
      .from('news_items')
      .select('id, title, summary, source_name, source_url, published_at, category_tag')
      .eq('market_id', market)
      .order('published_at', { ascending: false })
      .limit(10);

    if (cachedNews && cachedNews.length > 0) {
      setNewsItems(cachedNews);
    } else {
      // No cached news — trigger live fetch via edge function
      try {
        const { data: liveData } = await supabase.functions.invoke('fetch-market-news', {
          body: { marketId: market },
        });
        if (liveData?.data && liveData.data.length > 0) {
          // Re-query DB after edge function populates it
          const { data: freshNews } = await supabase
            .from('news_items')
            .select('id, title, summary, source_name, source_url, published_at, category_tag')
            .eq('market_id', market)
            .order('published_at', { ascending: false })
            .limit(10);
          if (freshNews) setNewsItems(freshNews);
        }
      } catch (e) {
        console.warn('Live news fetch failed:', e);
      }
    }

    // Check streak risk
    const riskHours = getStreakRiskHours(
      progress?.streak_expires_at || null,
      progress?.current_streak || 0,
      lessonCompletedToday,
    );
    setStreakRiskHours(riskHours);

    // Schedule streak-at-risk push notifications
    scheduleStreakNotifications(
      progress?.current_streak || 0,
      lessonCompletedToday,
    );

    // Fetch a rival for social nudge (person just above user on leaderboard)
    if (xpData?.total_xp && market) {
      try {
        const { data: rivals } = await supabase
          .from('user_xp')
          .select('total_xp, user_id, profiles!inner(username)')
          .eq('market_id', market)
          .gt('total_xp', xpData.total_xp)
          .order('total_xp', { ascending: true })
          .limit(1);

        if (rivals?.[0]) {
          const rival = rivals[0] as any;
          const rivalName = rival.profiles?.username || 'Someone';
          setSocialNudge({ name: rivalName, xp: rival.total_xp });
        }
      } catch (e) {
        // Silent — social nudge is non-critical
      }
    }

    // Fetch tomorrow's lesson for preview teaser
    const tomorrowDay = calcDay + 1;
    if (tomorrowDay <= 180) {
      try {
        const { data: tomorrowStacks } = await supabase
          .from('stacks')
          .select('title')
          .eq('market_id', market)
          .contains('tags', ['MICRO_LESSON', `day-${tomorrowDay}`])
          .not('published_at', 'is', null)
          .limit(1);

        if (tomorrowStacks?.[0]) {
          setTomorrowLesson({ title: tomorrowStacks[0].title, dayNumber: tomorrowDay });
        }
      } catch (e) {
        // Non-critical
      }
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const refreshNews = async () => {
    if (!selectedMarket || newsRefreshing) return;
    setNewsRefreshing(true);
    try {
      const { data: liveData } = await supabase.functions.invoke('fetch-market-news', {
        body: { marketId: selectedMarket },
      });
      const { data: freshNews } = await supabase
        .from('news_items')
        .select('id, title, summary, source_name, source_url, published_at, category_tag')
        .eq('market_id', selectedMarket)
        .order('published_at', { ascending: false })
        .limit(10);
      if (freshNews) setNewsItems(freshNews);
    } catch (e) {
      console.warn('News refresh failed:', e);
    } finally {
      setNewsRefreshing(false);
    }
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
    let earnedXP = XP_REWARDS.LESSON_COMPLETE;
    if (progress && activeStack) {
      await completeStack(activeStack.id);
      const updatedProgress = await updateStreak();
      await completeLessonForToday(activeStack.id);
      if ((progress.current_streak || 0) > 0) {
        const streakBonus = XP_REWARDS.STREAK_BONUS * (progress.current_streak || 1);
        await addXP(streakBonus, 'streak_bonus');
        earnedXP += streakBonus;
      }
      
      // Check milestones
      const mktName = getMarketName(selectedMarket || 'aerospace');
      const mktEmoji = getMarketEmoji(selectedMarket || 'aerospace');
      const newStreak = (updatedProgress as any)?.current_streak || progress.current_streak || 0;
      checkStreakMilestone(newStreak, mktName, mktEmoji);
      
      if (xpData) {
        checkLevelMilestone(xpData.current_level, mktName, mktEmoji);
      }
    }
    // Show gorgeous completion card instead of plain Alert
    setSessionXPEarned(earnedXP);
    setShowSessionComplete(true);
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
          isProUser={isProUser}
          onPaywallTrigger={() => {
            setShowReader(false);
            router.push('/subscription' as any);
          }}
          onAskMentor={() => {
            const lessonCtx = `The user is currently reading the lesson "${activeStack?.title}" (Day ${currentDay}) in the ${getMarketName(selectedMarket || 'aerospace')} market. They're on the last slide and want to discuss the content. Help them understand the material deeply.`;
            handleOpenMentorChat(lessonCtx);
          }}
          mentorName={getMentorForContext('strategy', selectedMarket || 'aerospace').name.split(' ')[0]}
        />
      ) : showSessionComplete ? (
        <SessionCompleteCard
          dayNumber={currentDay}
          marketName={getMarketName(selectedMarket || 'aerospace')}
          marketEmoji={getMarketEmoji(selectedMarket || 'aerospace')}
          xpEarned={sessionXPEarned}
          streak={streak}
          lessonTitle={activeStack?.title || lessonStack?.title || 'Lesson'}
          totalXP={xpData?.total_xp || 0}
          stageName={currentStage.name}
          onContinue={() => {
            setShowSessionComplete(false);
            fetchData();
          }}
          onDismiss={() => {
            setShowSessionComplete(false);
            fetchData();
          }}
          onAskMentor={() => {
            setShowSessionComplete(false);
            handleOpenMentorForLesson();
          }}
          mentorName={getMentorForContext('strategy', selectedMarket || 'aerospace').name.split(' ')[0]}
        />
      ) : (
        <>
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

          {/* Leo + Mentor Greeting */}
          <View style={styles.leoSection}>
            <View style={styles.leoRow}>
              <LeoCharacter size="lg" animation={leoAnimation} />
              {/* Mentor avatar — tap to chat */}
              <TouchableOpacity style={styles.mentorAvatarBtn} onPress={() => handleOpenMentorChat()}>
                {/* Real mentor portrait image */}
                {(() => {
                  const mentorId = getPrimaryMentorForMarket(selectedMarket || 'aerospace');
                  const avatarSrc = MENTOR_IMAGES[mentorId] || MENTOR_IMAGES.maya;
                  return (
                    <View style={styles.mentorAvatarCircle}>
                      <Image
                        source={avatarSrc}
                        style={styles.mentorAvatarImage}
                        resizeMode="cover"
                      />
                      {/* Live pulse indicator */}
                      <View style={styles.mentorPulse} />
                    </View>
                  );
                })()}
                <View style={styles.mentorChatBubble}>
                  <Text style={styles.mentorChatBubbleText}>Ask me →</Text>
                </View>
              </TouchableOpacity>
            </View>
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

          {/* ═══ STREAK AT RISK WARNING ═══ */}
          {streakRiskHours !== null && showStreakWarning && !lessonCompletedToday && (
            <StreakAtRisk
              streak={streak}
              hoursLeft={streakRiskHours}
              onStartLesson={() => lessonStack && handleOpenStack(lessonStack)}
              onDismiss={() => setShowStreakWarning(false)}
            />
          )}

          {/* ═══ TODAY'S MISSION — the ONE thing to do ═══ */}
          {lessonStack && (
            <TodaysMission
              dayNumber={currentDay}
              lessonTitle={lessonStack.title}
              marketEmoji={getMarketEmoji(selectedMarket || 'aerospace')}
              marketName={getMarketName(selectedMarket || 'aerospace')}
              xpReward={XP_REWARDS.LESSON_COMPLETE}
              duration={lessonStack.duration_minutes || 5}
              progress={lessonCompletedToday ? 1 : (currentDay / 180)}
              isCompleted={lessonCompletedToday}
              streak={streak}
              onStart={() => handleOpenStack(lessonStack)}
              onReview={() => handleOpenStack(lessonStack)}
              onPractice={() => router.push('/(tabs)/practice' as any)}
            />
          )}

          {/* ═══ POST-LESSON: Mentor Debrief — proactive AI connection ═══ */}
          {lessonCompletedToday && showMentorDebrief && lessonStack && (() => {
            const mentor = getMentorForContext('strategy', selectedMarket || 'aerospace');
            const mentorId = getPrimaryMentorForMarket(selectedMarket || 'aerospace');
            const mentorImage = MENTOR_IMAGES[mentorId] || MENTOR_IMAGES.maya;
            return (
              <MentorDebrief
                mentorName={mentor.name}
                mentorEmoji={mentor.emoji}
                mentorImage={mentorImage}
                lessonTitle={lessonStack.title}
                debriefQuestion={getDebriefQuestion(lessonStack.title)}
                onOpenChat={handleOpenMentorForLesson}
                onDismiss={() => setShowMentorDebrief(false)}
              />
            );
          })()}

          {/* ═══ POST-LESSON: Tomorrow's Preview — anticipation hook ═══ */}
          {lessonCompletedToday && tomorrowLesson && (
            <TomorrowPreview
              dayNumber={tomorrowLesson.dayNumber}
              lessonTitle={tomorrowLesson.title}
              marketEmoji={getMarketEmoji(selectedMarket || 'aerospace')}
              hoursUntilUnlock={(() => {
                const now = new Date();
                const midnight = new Date();
                midnight.setHours(24, 0, 0, 0);
                return (midnight.getTime() - now.getTime()) / (1000 * 60 * 60);
              })()}
            />
          )}

          {/* ═══ SOCIAL NUDGE — competitive motivation ═══ */}
          {socialNudge && showSocialNudge && !lessonCompletedToday && (
            <SocialNudge
              rivalName={socialNudge.name}
              rivalXP={socialNudge.xp}
              userXP={xpData?.total_xp || 0}
              marketName={getMarketName(selectedMarket || 'aerospace')}
              onViewLeaderboard={() => router.push('/leaderboard' as any)}
              onDismiss={() => setShowSocialNudge(false)}
            />
          )}

          {/* Daily Pattern (secondary content) */}
          {newsStack && !lessonCompletedToday && (
            <View style={styles.section}>
              <LessonCard
                title="Daily Pattern"
                subtitle="Industry Insight"
                headline={newsStack.title}
                xp={25}
                duration={newsStack.duration_minutes || 3}
                colorScheme="blue"
                onClick={() => handleOpenStack(newsStack)}
              />
            </View>
          )}

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
                {isProUser ? 'Become investment-ready • Optional extra XP' : 'Unlock with Pro • Expert-level scenarios'}
              </Text>
            </View>
            <Text style={styles.chevron}>→</Text>
          </TouchableOpacity>

          {/* KEY PLAYERS */}
          {selectedMarket && (
            <View style={styles.section}>
              <KeyPlayers marketId={selectedMarket} />
            </View>
          )}

          {/* INDUSTRY INTEL */}
          {selectedMarket && (
            <View style={styles.section}>
              <DailyNews marketId={selectedMarket} />
            </View>
          )}
        </ScrollView>
          {/* Mentor Chat Overlay */}
          {activeMentor && (
            <MentorChatOverlay
              visible={mentorChatVisible}
              mentor={activeMentor}
              onClose={() => { setMentorChatVisible(false); setMentorChatContext(''); }}
              marketId={selectedMarket || undefined}
              context={mentorChatContext || `${getMarketName(selectedMarket || 'aerospace')} industry learning. The user is on Day ${currentDay} of 180. Recent news: ${newsItems.slice(0, 3).map(n => n.title).join('; ')}`}
            />
          )}
        </>
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
  leoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, marginBottom: 4 },
  leoMessage: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 6 },
  mentorAvatarBtn: { alignItems: 'center', gap: 6 },
  mentorAvatarCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderWidth: 2, borderColor: COLORS.accent,
    overflow: 'hidden',
    position: 'relative',
  },
  mentorAvatarImage: { width: '100%', height: '100%' },
  mentorPulse: {
    position: 'absolute', bottom: 0, right: 0,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2, borderColor: COLORS.bg0,
  },
  mentorChatBubble: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10,
  },
  mentorChatBubbleText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
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
  emptyNewsCard: {
    padding: 24, borderRadius: 16, backgroundColor: COLORS.bg2,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', gap: 12,
  },
  emptyNewsText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center' },
  fetchNewsBtn: {
    backgroundColor: COLORS.accent, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20,
  },
  fetchNewsBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
});
