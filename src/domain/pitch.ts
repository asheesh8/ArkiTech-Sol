import type { BusinessSnapshot } from './types';

export interface PitchScript {
  opening: string;
  hook: string;
  problem: string;
  solution: string;
  close: string;
}

export function buildPitchScript(business: BusinessSnapshot, competitor: BusinessSnapshot): PitchScript {
  const reviewGap = Math.max(competitor.reviewCount - business.reviewCount, 0);
  return {
    opening: `Hi, is this the owner of ${business.name}? I’m calling from ArkiTech-Sol with something specific we noticed about your Google presence.`,
    hook: `${competitor.name} nearby has ${reviewGap} more reviews than ${business.name}. Customers see that gap in seconds, even when your service is better.`,
    problem: `You’re sitting at ${business.rating.toFixed(1)} stars with ${business.reviewCount} reviews, and the last visible activity is about ${business.lastReviewDaysAgo} days old. That trust gap quietly redirects high-intent customers.`,
    solution: 'We monitor reviews, improve your Google Business Profile, help you ask real customers at the right moment, and show the movement every week.',
    close: 'No contract. No card. Thirty days on us. At the end we show you the delta, and that meeting usually sells itself. Would next Tuesday work for a 15-minute setup?',
  };
}
