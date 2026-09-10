import {
  createAudioPlayer,
  setAudioModeAsync as setExpoAudioModeAsync,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';

export type PlaybackStatus = Pick<AudioStatus, 'didJustFinish' | 'isLoaded' | 'playing'>;

export interface ManagedSound {
  setOnPlaybackStatusUpdate(listener: ((status: PlaybackStatus) => void) | null): void;
  stopAsync(): Promise<void>;
  unloadAsync(): Promise<void>;
}

export async function configurePlaybackAsync(): Promise<void> {
  await setExpoAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });
}

export async function createAndPlaySound(
  uri: string,
  volume = 1,
): Promise<ManagedSound> {
  const player = createAudioPlayer({ uri }, { updateInterval: 250 });
  player.volume = volume;

  let subscription: { remove(): void } | null = null;
  let removed = false;

  const sound: ManagedSound = {
    setOnPlaybackStatusUpdate(listener) {
      subscription?.remove();
      subscription = listener
        ? player.addListener('playbackStatusUpdate', listener)
        : null;
    },
    async stopAsync() {
      if (removed) return;
      player.pause();
      await player.seekTo(0);
    },
    async unloadAsync() {
      if (removed) return;
      removed = true;
      subscription?.remove();
      subscription = null;
      player.remove();
    },
  };

  const startWhenReady = (status: AudioStatus) => {
    if (!status.isLoaded || removed) return;
    readySubscription.remove();
    player.play();
  };
  const readySubscription = player.addListener('playbackStatusUpdate', startWhenReady);
  if (player.isLoaded) {
    readySubscription.remove();
    player.play();
  }

  return sound;
}

export type { AudioPlayer };