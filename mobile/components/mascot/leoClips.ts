export const leoClips = {
  'leo-sleep-loop': { source: require('../../assets/mascot/anim/leo-sleep-loop.webp'), ms: 7567, loop: true },
  'leo-peek': { source: require('../../assets/mascot/anim/leo-peek.webp'), ms: 2667, loop: false },
  'leo-eyes-open': { source: require('../../assets/mascot/anim/leo-eyes-open.webp'), ms: 800, loop: false },
  'leo-eyes-close': { source: require('../../assets/mascot/anim/leo-eyes-close.webp'), ms: 800, loop: false },
  'leo-wake': { source: require('../../assets/mascot/anim/leo-wake.webp'), ms: 2000, loop: false },
  'leo-doze': { source: require('../../assets/mascot/anim/leo-doze.webp'), ms: 2667, loop: false },
  'leo-reading-loop': { source: require('../../assets/mascot/anim/leo-reading-loop.webp'), ms: 9333, loop: true },
  'leo-done': { source: require('../../assets/mascot/anim/leo-done.webp'), ms: 5067, loop: false },
  'leo-call-listen': { source: require('../../assets/mascot/anim/leo-call-listen.webp'), ms: 7917, loop: true },
  'leo-call-think': { source: require('../../assets/mascot/anim/leo-call-think.webp'), ms: 6917, loop: true },
  'leo-call-talk': { source: require('../../assets/mascot/anim/leo-call-talk.webp'), ms: 5883, loop: true },
  'leo-teach-loop': { source: require('../../assets/mascot/anim/leo-teach-loop.webp'), ms: 4600, loop: true },
  'leo-idle-loop': { source: require('../../assets/mascot/anim/leo-idle-loop.webp'), ms: 8867, loop: true },
  'leo-play': { source: require('../../assets/mascot/anim/leo-play.webp'), ms: 5333, loop: false },
  'leo-greet': { source: require('../../assets/mascot/anim/leo-greet.webp'), ms: 2000, loop: false },
  'leo-ready': { source: require('../../assets/mascot/anim/leo-ready.webp'), ms: 2000, loop: false },
  'leo-encourage': { source: require('../../assets/mascot/anim/leo-encourage.webp'), ms: 2000, loop: false },
  'leo-success': { source: require('../../assets/mascot/anim/leo-success.webp'), ms: 2000, loop: false },
} as const;

export type LeoClip = keyof typeof leoClips;
