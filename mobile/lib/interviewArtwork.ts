import flashcards from '../assets/illustrations/interview-flashcards.png.asset.json';
import research from '../assets/illustrations/interview-research.png.asset.json';
import speaking from '../assets/illustrations/interview-speaking.png.asset.json';
import analysis from '../assets/illustrations/interview-analysis.png.asset.json';

export const INTERVIEW_ARTWORK = {
  practice: { uri: new URL(flashcards.url, 'https://www.market-verse.com').href },
  framework: { uri: new URL(research.url, 'https://www.market-verse.com').href },
  response: { uri: new URL(speaking.url, 'https://www.market-verse.com').href },
  verdict: { uri: new URL(analysis.url, 'https://www.market-verse.com').href },
};