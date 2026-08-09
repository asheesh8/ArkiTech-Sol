/**
 * Content for the /videoad pitch page.
 *
 * Media: drop real files in `public/reels/` and point the `src`/`poster` fields at them
 * (e.g. `/reels/hero.mp4`, `/reels/hero.jpg`). While `src` is empty the page renders a
 * designed poster frame instead of a dead player, so nothing ever looks broken on screen.
 *
 * Pricing mirrors the plan ladder in `docs/source/ARKITECH_CLAUDECODE_V2.md`.
 */

export type Reel = { src: string; poster: string; label: string; caption: string; length: string; art: 1 | 2 | 3 };

export const heroReel: Reel = { src: '', poster: '', label: 'Sample reel', caption: 'Hillside Dental — 30s spot', length: '0:30', art: 1 };

export const reels: Reel[] = [
  { src: '', poster: '', label: 'Storefront', caption: 'Walk-in hook, first 3 seconds', length: '0:15', art: 1 },
  { src: '', poster: '', label: 'Owner story', caption: 'Face to the name, built on trust', length: '0:30', art: 2 },
  { src: '', poster: '', label: 'Offer spot', caption: 'One promotion, one clear ask', length: '0:20', art: 3 },
];

export const guarantees = [
  { value: '72h', label: 'First cut delivered', note: 'From the day we shoot' },
  { value: '4K', label: 'Vertical + widescreen', note: 'Reels, Shorts, TikTok, web' },
  { value: '2', label: 'Revision rounds', note: 'Included on every ad' },
  { value: '100%', label: 'You own the footage', note: 'Raw files handed over' },
];

export const included = [
  { icon: 'clapper', title: 'We shoot on site', body: 'Half a day at your storefront. No studio booking, no crew of ten, no closing early.' },
  { icon: 'film', title: 'Cut for every feed', body: 'One shoot, delivered vertical for Reels and Shorts plus a widescreen cut for your site.' },
  { icon: 'sparkles', title: 'Written to convert', body: 'Hook in the first three seconds, proof in the middle, one clear ask at the end.' },
  { icon: 'badge', title: 'Captions and licensing', body: 'Burned-in captions for silent autoplay, and music cleared for commercial use.' },
];

export const process = [
  { step: '01', title: 'Fifteen minute call', body: 'We pin down the one thing the ad has to say and who it has to reach.' },
  { step: '02', title: 'Half-day shoot', body: 'We come to you. Storefront, team, product — whatever carries the story.' },
  { step: '03', title: 'First cut in 72 hours', body: 'You review on your phone and mark anything you want changed.' },
  { step: '04', title: 'Delivered and live', body: 'Final files in every format, ready to post or run as paid.' },
];

export const packages = [
  {
    name: 'ReviewTainer',
    price: '$197',
    cadence: '/mo',
    tagline: 'One ad a month, steady presence.',
    features: ['1 vertical ad per month', 'Captions and licensed music', '2 revision rounds', 'Raw footage handed over', 'Google profile kept current'],
    featured: false,
  },
  {
    name: 'UltraRetainer',
    price: '$347',
    cadence: '/mo',
    tagline: 'Enough output to actually stay in the feed.',
    features: ['3 vertical ads per month', 'Widescreen cut for your website', 'Priority 48h first cut', 'Unlimited revision rounds', 'Monthly performance readout', 'Everything in ReviewTainer'],
    featured: true,
  },
  {
    name: 'Custom production',
    price: 'One-time',
    cadence: '',
    tagline: 'A single campaign, brand film, or launch.',
    features: ['Scoped to the project', 'Multi-day shoot available', 'Full commercial licensing', 'Optional IP buyout'],
    featured: false,
  },
];

export const objections = [
  { question: 'We already tried video and it went nowhere.', answer: 'Usually because it was one long brand film nobody finished watching. We cut short, feed-native spots with the hook in the first three seconds — the format the platforms actually push.' },
  { question: 'Do we need to be on camera?', answer: 'No. Owner-on-camera performs best for local trust, but storefront, product, and team footage carry an ad on their own if you would rather stay behind the lens.' },
  { question: 'How much of our time does this take?', answer: 'A fifteen minute call and half a day on site. After that you review a cut on your phone. That is the whole ask.' },
  { question: 'What happens if we stop?', answer: 'You keep everything. Final cuts and raw footage are yours, and there is no clawback on work already delivered.' },
];
