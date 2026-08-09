import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Clapperboard, Film, LogIn, Play, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { guarantees, heroReel, included, objections, packages, process, reels, type Reel } from './videoAdContent';

const featureIcons = { clapper: Clapperboard, film: Film, sparkles: Sparkles, badge: BadgeCheck } as const;

function useReveal() {
  const reduced = useReducedMotion();
  return {
    initial: reduced ? undefined : { opacity: 0, y: 18 },
    whileInView: reduced ? undefined : { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-70px' },
    transition: { duration: 0.5, ease: [0.22, 0.61, 0.36, 1] as const },
  };
}

/** Plays a real file when one is configured; otherwise renders a designed poster frame. */
function ReelFrame({ reel, className = '' }: { reel: Reel; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const toggle = () => {
    const element = video.current;
    if (!element) return;
    if (element.paused) { void element.play(); setPlaying(true); } else { element.pause(); setPlaying(false); }
  };

  return (
    <figure className={`videoad-frame videoad-art-${reel.art} ${className}`}>
      <div className="videoad-frame-media">
        {reel.src ? (
          <video ref={video} src={reel.src} poster={reel.poster || undefined} muted={muted} loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
        ) : (
          <div className="videoad-frame-poster" role="img" aria-label={`${reel.caption} — preview frame`}><span className="videoad-frame-grid" /><span className="videoad-frame-glyph"><Film size={20} /></span></div>
        )}
        <span className="videoad-frame-sheen" aria-hidden="true" />
        {reel.src ? (
          <div className="videoad-frame-controls">
            <button type="button" className="videoad-play" onClick={toggle} aria-label={playing ? `Pause ${reel.caption}` : `Play ${reel.caption}`} aria-pressed={playing}>
              {playing ? <span className="videoad-pause-glyph" aria-hidden="true"><i /><i /></span> : <Play size={17} fill="currentColor" />}
            </button>
            <button type="button" className="videoad-mute" onClick={() => { setMuted((value) => !value); if (video.current) video.current.muted = !muted; }} aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={!muted}>
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
        ) : null}
        <span className="videoad-frame-length">{reel.length}</span>
      </div>
      <figcaption><strong>{reel.label}</strong><span>{reel.caption}</span></figcaption>
    </figure>
  );
}

export function VideoAdPage() {
  const reveal = useReveal();

  useEffect(() => {
    const previous = document.title;
    document.title = 'Video Ads — ArkiTech';
    return () => { document.title = previous; };
  }, []);

  return (
    <div className="videoad-page">
      <span className="videoad-glow" aria-hidden="true" />

      <header className="videoad-topbar">
        <Link to="/" className="finder-brand"><span className="brand-mark"><i /><i /></span><strong>ArkiTech</strong></Link>
        <nav aria-label="Page sections"><a href="#work">Work</a><a href="#process">Process</a><a href="#pricing">Pricing</a></nav>
        <div className="videoad-topbar-actions">
          <Link to="/login" className="videoad-signin"><LogIn size={15} />Sign in</Link>
          <a className="button button-primary" href="#pricing">Book a shoot</a>
        </div>
      </header>

      <main className="videoad-main">
        <section className="videoad-hero">
          <motion.div className="videoad-hero-copy" initial={reveal.initial} animate={reveal.initial ? { opacity: 1, y: 0 } : undefined} transition={reveal.transition}>
            <span className="videoad-eyebrow"><Sparkles size={13} />Video ads for local business</span>
            <h1>Your best fifteen seconds, shot and cut for the feed.</h1>
            <p>Most local businesses lose the customer before the third second. We shoot at your storefront and deliver short, vertical ads built to stop the scroll — first cut in your hands within 72 hours.</p>
            <div className="videoad-hero-actions">
              <a className="button button-primary" href="#pricing">See packages <ArrowRight size={16} /></a>
              <a className="button button-secondary" href="#work">Watch the work</a>
            </div>
            <ul className="videoad-hero-proof">
              <li><Check /> Half a day on site</li>
              <li><Check /> Every format delivered</li>
              <li><Check /> You keep the footage</li>
            </ul>
          </motion.div>
          <motion.div className="videoad-hero-media" initial={reveal.initial ? { opacity: 0, y: 26 } : undefined} animate={reveal.initial ? { opacity: 1, y: 0 } : undefined} transition={{ ...reveal.transition, delay: 0.1 }}>
            <ReelFrame reel={heroReel} className="videoad-frame-hero" />
          </motion.div>
        </section>

        <motion.section className="videoad-guarantees" aria-label="What every engagement includes" {...reveal}>
          {guarantees.map((item) => (
            <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span><small>{item.note}</small></div>
          ))}
        </motion.section>

        <motion.section className="videoad-section" id="work" {...reveal}>
          <div className="videoad-section-head">
            <div><span className="videoad-kicker">The work</span><h2>Three formats, one shoot.</h2></div>
            <p>Every package comes out of a single visit. We cut it into the spots that each feed rewards.</p>
          </div>
          <div className="videoad-reels">
            {reels.map((reel) => <ReelFrame key={reel.label} reel={reel} />)}
            <a className="videoad-reel-cta" href="#book"><span><Clapperboard size={19} /></span><strong>Your business here</strong><small>Half a day on site is all it takes</small><span className="videoad-reel-cta-link">Book a shoot <ArrowRight size={13} /></span></a>
          </div>
        </motion.section>

        <motion.section className="videoad-section" {...reveal}>
          <div className="videoad-section-head">
            <div><span className="videoad-kicker">Included</span><h2>What lands in your inbox.</h2></div>
          </div>
          <div className="videoad-included">
            {included.map((item) => {
              const Icon = featureIcons[item.icon as keyof typeof featureIcons];
              return <article key={item.title}><span className="videoad-feature-icon"><Icon size={19} /></span><h3>{item.title}</h3><p>{item.body}</p></article>;
            })}
          </div>
        </motion.section>

        <motion.section className="videoad-section" id="process" {...reveal}>
          <div className="videoad-section-head">
            <div><span className="videoad-kicker">Process</span><h2>Four steps, two weeks, done.</h2></div>
            <p>You are involved for about half a day in total. We handle the rest.</p>
          </div>
          <ol className="videoad-process">
            {process.map((item) => <li key={item.step}><span>{item.step}</span><div><h3>{item.title}</h3><p>{item.body}</p></div></li>)}
          </ol>
        </motion.section>

        <motion.section className="videoad-section" id="pricing" {...reveal}>
          <div className="videoad-section-head">
            <div><span className="videoad-kicker">Pricing</span><h2>Pick the cadence that fits.</h2></div>
            <p>Month to month. Cancel whenever — everything delivered stays yours.</p>
          </div>
          <div className="videoad-packages">
            {packages.map((plan) => (
              <article key={plan.name} className={plan.featured ? 'videoad-package featured' : 'videoad-package'}>
                {plan.featured ? <span className="videoad-package-flag">Most booked</span> : null}
                <h3>{plan.name}</h3>
                <p className="videoad-package-tagline">{plan.tagline}</p>
                <div className={plan.cadence ? 'videoad-package-price' : 'videoad-package-price is-text'}><strong>{plan.price}</strong>{plan.cadence ? <span>{plan.cadence}</span> : null}</div>
                <ul>{plan.features.map((feature) => <li key={feature}><Check />{feature}</li>)}</ul>
                <a className={plan.featured ? 'button button-primary' : 'button button-secondary'} href="#book">Book a shoot <ArrowRight size={15} /></a>
              </article>
            ))}
          </div>
        </motion.section>

        <motion.section className="videoad-section videoad-objections" {...reveal}>
          <div className="videoad-section-head">
            <div><span className="videoad-kicker">Straight answers</span><h2>The things owners actually ask.</h2></div>
          </div>
          <div className="videoad-faq">
            {objections.map((item) => <details key={item.question}><summary>{item.question}<span aria-hidden="true" /></summary><p>{item.answer}</p></details>)}
          </div>
        </motion.section>

        <motion.section className="videoad-cta" id="book" {...reveal}>
          <div>
            <span className="videoad-kicker">Next step</span>
            <h2>Fifteen minutes tells us if this is worth doing.</h2>
            <p>No deck, no pressure. We look at what you are running now and say plainly whether video moves the needle for your business.</p>
          </div>
          <div className="videoad-cta-actions">
            <Link className="button button-primary" to="/">Find my business <ArrowRight size={16} /></Link>
            <a className="button button-secondary" href="mailto:hello@arkitech-sol.com?subject=Video%20ad%20enquiry">Email us</a>
          </div>
        </motion.section>
      </main>

      <footer className="videoad-footer">
        <span><Clapperboard size={14} />ArkiTech-Sol — video production for local business</span>
        <Link to="/">Business Finder</Link>
      </footer>
    </div>
  );
}

/** Small inline tick so list markers stay on-brand without pulling another icon size into every row. */
function Check() {
  return <svg className="videoad-tick" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.4 8.4l3 3 6.2-7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
