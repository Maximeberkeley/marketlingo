import { useEffect, useRef, useState } from 'react';
import leoAnimation from '@/assets/mascot/anim/leo-idle-loop.webp.asset.json';
import leoFallback from '@/assets/mascot/leo-reference.png';

/** Load one transparent clip only while its opening-page placement is visible. */
export function LandingLeo({ className }: { className: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [canAnimate, setCanAnimate] = useState(false);
  const [inView, setInView] = useState(false);
  const [failed, setFailed] = useState(false);
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
  return <div ref={container} className={`landing-leo ${className}`}>
    <img src={leoFallback} alt="Leo, your learning companion" className="landing-leo-static" />
    {animated && <img src={leoAnimation.url} alt="" aria-hidden="true" className="landing-leo-animation" onError={() => setFailed(true)} />}
  </div>;
}