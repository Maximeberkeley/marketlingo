import { useEffect, useRef, useState } from 'react';
import leoAnimation from '@/assets/mascot/anim/leo-idle-loop.webp.asset.json';
import leoJump from '@/assets/mascot/anim/leo-done.webp.asset.json';
import leoFallback from '@/assets/mascot/leo-reference.png';
import leoCelebrating from '@/assets/mascot/leo-celebrating.png';

/** Load one transparent clip only while its opening-page placement is visible. */
export function LandingLeo({ className, clip = 'idle' }: { className: string; clip?: 'idle' | 'jump' }) {
  const container = useRef<HTMLDivElement>(null);
  const [canAnimate, setCanAnimate] = useState(false);
  const [inView, setInView] = useState(false);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setCanAnimate(!preference.matches && document.visibilityState === 'visible');
    update();
    preference.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    const observer = new IntersectionObserver(entries => setInView(entries.some(entry => entry.isIntersecting)));
    if (container.current) observer.observe(container.current);
    return () => { observer.disconnect(); preference.removeEventListener('change', update); document.removeEventListener('visibilitychange', update); };
  }, []);
  const animated = canAnimate && inView && !failed;
  const animation = clip === 'jump' ? leoJump : leoAnimation;
  const fallback = clip === 'jump' ? leoCelebrating : leoFallback;
  return <div ref={container} className={`landing-leo ${className}`}>
    <img src={fallback} alt="Leo, your learning companion" className={`landing-leo-static${animated && loaded ? ' invisible' : ''}`} />
    {animated && <img src={animation.url} alt="" aria-hidden="true" className="landing-leo-animation" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
  </div>;
}