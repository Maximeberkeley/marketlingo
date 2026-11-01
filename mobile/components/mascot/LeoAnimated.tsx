import React, { useEffect, useRef, useState } from 'react';
import { Image as StaticImage, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LeoCharacter, LeoAnim } from './LeoCharacter';
import { leoClips, LeoClip } from './leoClips';
import { useLeoMotion } from './useLeoMotion';

interface LeoAnimatedProps {
  clip: LeoClip;
  size: number;
  fallback: LeoAnim | ImageSourcePropType;
  paused?: boolean;
  onEnd?: () => void;
}

function ClipLayer({ clip, onLoad, onEnd, onError }: {
  clip: LeoClip; onLoad: () => void; onEnd: () => void; onError: () => void;
}) {
  const image = useRef<Image>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loaded = useRef(false);
  const callbacks = useRef({ onLoad, onEnd, onError });
  callbacks.current = { onLoad, onEnd, onError };
  const metadata = leoClips[clip];
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    void image.current?.stopAnimating().catch(() => {});
  }, []);
  return <Image ref={image} source={metadata.source} style={StyleSheet.absoluteFill}
    contentFit="contain" autoplay transition={0}
    onLoad={() => {
      if (loaded.current) return;
      loaded.current = true;
      callbacks.current.onLoad();
      if (!metadata.loop) timer.current = setTimeout(() => {
        // Explicitly stop on the last frame, even if a decoder repeats the WebP.
        void image.current?.stopAnimating().catch(() => {});
        callbacks.current.onEnd();
      }, metadata.ms);
    }} onError={() => {
      if (timer.current) clearTimeout(timer.current);
      callbacks.current.onError();
    }} />;
}

/** A fresh player is mounted after pause; each new clip receives a fresh play key. */
function ClipPlayer({ clip, size, fallback, onEnd }: LeoAnimatedProps) {
  const sequence = useRef(0);
  const [layers, setLayers] = useState([{ clip, id: 0 }]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);
  useEffect(() => {
    if (layers[layers.length - 1]?.clip === clip) return;
    const id = ++sequence.current;
    latest.current = id;
    setFailed(false);
    // Retain the displayed layer while the replacement decodes.
    setLayers(previous => [...previous.slice(-1), { clip, id }]);
  }, [clip, layers]);
  const canvas = size * 4 / 3;
  return <View pointerEvents="none" style={{ width: size, height: size, overflow: 'visible' }}>
    {(!loaded || failed) && <StaticLeo size={size} fallback={fallback} />}
    {!failed && <View style={{ position: 'absolute', width: canvas, height: canvas, left: -size / 6, top: -size / 6 }}>
      {layers.map(layer => <ClipLayer key={layer.id} clip={layer.clip}
        onLoad={() => {
          if (layer.id !== latest.current) return;
          setLoaded(true);
          setLayers([layer]);
        }}
        onEnd={() => { if (layer.id === latest.current) onEnd?.(); }}
        onError={() => { if (layer.id === latest.current) { setFailed(true); onEnd?.(); } }} />)}
    </View>}
  </View>;
}

function StaticLeo({ size, fallback }: Pick<LeoAnimatedProps, 'size' | 'fallback'>) {
  if (typeof fallback !== 'string') return <StaticImage source={fallback} resizeMode="contain" style={{ width: size, height: size }} />;
  // Preserve LeoCharacter's exact native pose dimensions at any measured size.
  return <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 160, height: 160, transform: [{ scale: size / 160 }] }}>
      <LeoCharacter size="lg" animation={fallback} still />
    </View>
  </View>;
}

export function LeoAnimated(props: LeoAnimatedProps) {
  const motion = useLeoMotion(props.paused);
  return <View pointerEvents="none" style={{ width: props.size, height: props.size, overflow: 'visible' }}>
    {motion ? <ClipPlayer {...props} /> : <StaticLeo size={props.size} fallback={props.fallback} />}
  </View>;
}