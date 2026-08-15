import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  MockPrompt, MCQQuestion, MentalMathQuestion, BigBossQuestion,
  dbToMockPrompt, dbToMCQ, dbToMentalMath, dbToBigBoss,
} from '../lib/interviewLabData';
import { log } from '../lib/logger';

interface UseInterviewQuestionsResult {
  mockQuestions: MockPrompt[];
  mcqQuestions: MCQQuestion[];
  mentalMathQuestions: MentalMathQuestion[];
  bigBossQuestions: BigBossQuestion[];
  loading: boolean;
  heroProblem: string;
}

export function useInterviewQuestions(marketId: string | null, path: string): UseInterviewQuestionsResult {
  const [mockQuestions, setMockQuestions] = useState<MockPrompt[]>([]);
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[]>([]);
  const [mentalMathQuestions, setMentalMathQuestions] = useState<MentalMathQuestion[]>([]);
  const [bigBossQuestions, setBigBossQuestions] = useState<BigBossQuestion[]>([]);
  const [heroProblem, setHeroProblem] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!marketId) { setLoading(false); return; }

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        // Fetch all question types in parallel
        const [mockRes, mcqRes, mathRes, bossRes] = await Promise.all([
          supabase.from('interview_questions')
            .select('*')
            .eq('market_id', marketId)
            .eq('question_type', 'mock')
            .eq('path', path)
            .eq('is_active', true)
            .order('sort_order'),
          supabase.from('interview_questions')
            .select('*')
            .eq('market_id', marketId)
            .eq('question_type', 'mcq')
            .eq('path', path)
            .eq('is_active', true)
            .order('sort_order'),
          supabase.from('interview_questions')
            .select('*')
            .eq('market_id', marketId)
            .eq('question_type', 'mental_math')
            .eq('is_active', true)
            .order('sort_order'),
          supabase.from('interview_questions')
            .select('*')
            .eq('market_id', marketId)
            .eq('question_type', 'big_boss')
            .eq('is_active', true)
            .order('sort_order'),
        ]);

        const mocks = (mockRes.data || []).map(dbToMockPrompt);
        const mcqs = (mcqRes.data || []).map(dbToMCQ);
        const maths = (mathRes.data || []).map(dbToMentalMath);
        const bosses = (bossRes.data || []).map(dbToBigBoss);

        setMockQuestions(mocks.length > 0 ? mocks : getDefaultMocks());
        setMcqQuestions(mcqs.length > 0 ? mcqs : getDefaultMCQs());
        setMentalMathQuestions(maths);
        setBigBossQuestions(bosses.length > 0 ? bosses : getDefaultBigBoss());
        setHeroProblem(mocks[0]?.heroProblem || '');
      } catch (err) {
        log.warn('Failed to fetch interview questions:', err);
        setMockQuestions(getDefaultMocks());
        setMcqQuestions(getDefaultMCQs());
        setBigBossQuestions(getDefaultBigBoss());
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [marketId, path]);

  return { mockQuestions, mcqQuestions, mentalMathQuestions, bigBossQuestions, loading, heroProblem };
}

function getDefaultMocks(): MockPrompt[] {
  return [
    { scenario: 'You\'re interviewing for a strategy role at a fast-growing tech company.', question: 'Tell me about a time you led a team through a difficult challenge.', buzzwords: ['leadership', 'stakeholder', 'KPI', 'pivot', 'iteration'], sampleAnswer: 'Using the STAR method...' },
    { scenario: 'You\'re consulting for a company entering a new market.', question: 'How would you determine if this market is worth entering?', buzzwords: ['TAM', 'SAM', 'SOM', 'competitive landscape', 'barriers to entry', 'unit economics'], sampleAnswer: 'First, size the market. Second, map competition. Third, build a P&L model.' },
  ];
}

function getDefaultMCQs(): MCQQuestion[] {
  return [
    { question: 'An interviewer asks "Tell me about yourself." What\'s the best structure?', options: ['Start from childhood', 'Present → Past → Future (2 minutes max)', 'Read your resume out loud', 'Ask them to go first'], correctIndex: 1, explanation: 'The Present-Past-Future format is concise and compelling.' },
    { question: 'You don\'t know the answer to a technical question. Best response?', options: ['"I don\'t know"', '"Great question — here\'s how I\'d think about it..."', 'Change the subject', 'Make up an answer'], correctIndex: 1, explanation: 'Showing your thought process is more valuable than knowing every answer.' },
  ];
}

function getDefaultBigBoss(): BigBossQuestion[] {
  return [
    { question: 'Tell me about a complex problem you solved.', tip: 'Use STAR method with specific metrics.' },
    { question: 'Why should we hire you over other candidates?', tip: 'Focus on unique value and specific examples.' },
  ];
}
