import React, { useEffect, useRef, useState } from "react";
import { Image as StaticImage, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LeoCharacter } from "./LeoCharacter";
import { leoClips } from "./leoClips";
import { useLeoMotion } from "./useLeoMotion";
import { log } from "../../lib/logger";
function ClipLayer({ clip, onLoad, onEnd, onError }) {
  const image = useRef(null);
  const timer = useRef(null);
  const loaded = useRef(false);
  const callbacks = useRef({ onLoad, onEnd, onError });
  callbacks.current = { onLoad, onEnd, onError };
  const metadata = leoClips[clip];
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    void image.current?.stopAnimating().catch(() => {
    });
  }, []);
  return /* @__PURE__ */ React.createElement(
    Image,
    {
      ref: image,
      source: metadata.source,
      style: StyleSheet.absoluteFill,
      contentFit: "contain",
      autoplay: true,
      transition: 0,
      useAppleWebpCodec: false,
      onLoad: () => {
        if (loaded.current) return;
        loaded.current = true;
        callbacks.current.onLoad();
        if (!metadata.loop) timer.current = setTimeout(() => {
          void image.current?.stopAnimating().catch(() => {
          });
          callbacks.current.onEnd();
        }, metadata.ms);
      },
      onError: () => {
        if (timer.current) clearTimeout(timer.current);
        callbacks.current.onError();
      }
    }
  );
}
function ClipPlayer({ clip, size, fallback, onEnd }) {
  const sequence = useRef(0);
  const [layers, setLayers] = useState([{ clip, id: 0 }]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);
  const displayed = useRef(null);
  useEffect(() => {
    if (layers[layers.length - 1]?.clip === clip) return;
    const id = ++sequence.current;
    latest.current = id;
    setFailed(false);
    const next = { clip, id };
    setLayers([...displayed.current ? [displayed.current] : [], next]);
  }, [clip, layers]);
  useEffect(() => {
    if (typeof __DEV__ !== "undefined" && __DEV__) console.log("[LeoAnimated] clip", clip);
    const timer = setTimeout(() => {
      setLayers((current) => {
        const newest = current[current.length - 1];
        if (!newest || current.length === 1) return current;
        displayed.current = newest;
        return [newest];
      });
      setLoaded(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [clip]);
  const canvas = size * 4 / 3;
  return /* @__PURE__ */ React.createElement(View, { pointerEvents: "none", style: { width: size, height: size, overflow: "visible" } }, (!loaded || failed) && /* @__PURE__ */ React.createElement(StaticLeo, { size, fallback }), !failed && /* @__PURE__ */ React.createElement(View, { style: { position: "absolute", width: canvas, height: canvas, left: -size / 6, top: -size / 6 } }, layers.map((layer) => /* @__PURE__ */ React.createElement(
    ClipLayer,
    {
      key: layer.id,
      clip: layer.clip,
      onLoad: () => {
        if (layer.id !== latest.current) return;
        displayed.current = layer;
        setLoaded(true);
        setLayers([layer]);
      },
      onEnd: () => {
        if (layer.id === latest.current) onEnd?.();
      },
      onError: () => {
        if (layer.id === latest.current) {
          setFailed(true);
          onEnd?.();
        }
      }
    }
  ))));
}
function StaticLeo({ size, fallback }) {
  if (typeof fallback !== "string") return /* @__PURE__ */ React.createElement(StaticImage, { source: fallback, resizeMode: "contain", style: { width: size, height: size } });
  return /* @__PURE__ */ React.createElement(View, { style: { width: size, height: size, alignItems: "center", justifyContent: "center" } }, /* @__PURE__ */ React.createElement(View, { style: { width: 160, height: 160, transform: [{ scale: size / 160 }] } }, /* @__PURE__ */ React.createElement(LeoCharacter, { size: "lg", animation: fallback, still: true })));
}
class LeoErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    log.warn("[LeoAnimated] Showing the still Leo after an error:", error);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function LeoAnimated(props) {
  const motion = useLeoMotion(props.paused);
  const still = /* @__PURE__ */ React.createElement(StaticLeo, { size: props.size, fallback: props.fallback });
  return /* @__PURE__ */ React.createElement(View, { pointerEvents: "none", style: { width: props.size, height: props.size, overflow: "visible" } }, motion ? /* @__PURE__ */ React.createElement(LeoErrorBoundary, { fallback: still }, /* @__PURE__ */ React.createElement(ClipPlayer, { ...props })) : still);
}
export {
  LeoAnimated
};
