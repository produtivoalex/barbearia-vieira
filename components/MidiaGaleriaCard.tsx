import React, { Component, ReactNode } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import { Play, Camera } from 'lucide-react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { useTheme } from '@/contexts/ThemeContext';
import { FontFamily, FontSize, Radii, Spacing, ThemePalette } from '@/theme';

export function isMidiaVideo(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|mov|webm|m4v|3gp|mkv)(\?|$)/i.test(url);
}

export function isMidiaGif(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(gif|webp)(\?|$)/i.test(url);
}

// ─── VERIFICAÇÃO SEGURA DE MÓDULO NATIVO (PREVINE CRASHES) ───
let cachedExpoVideo: any = undefined;

function getExpoVideoModule(): any | null {
  if (cachedExpoVideo !== undefined) {
    return cachedExpoVideo;
  }
  try {
    const nativeModule = requireOptionalNativeModule('ExpoVideo');
    if (nativeModule) {
      cachedExpoVideo = require('expo-video');
      return cachedExpoVideo;
    }
  } catch (err) {
    console.log('[MidiaGaleriaCard] Native video module not available in this build');
  }
  cachedExpoVideo = null;
  return null;
}

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class NativeVideoErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Fallback silencioso seguro
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function NativeLoopPlayerWithHooks({
  uri,
  style,
  expoVideo,
}: {
  uri: string;
  style?: StyleProp<ViewStyle>;
  expoVideo: any;
}) {
  const { useVideoPlayer, VideoView } = expoVideo;
  const player = useVideoPlayer(uri, (p: any) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={[styles.videoView, style]}
      contentFit="cover"
      nativeControls={false}
      allowsFullscreen={false}
      startsPictureInPictureAutomatically={false}
    />
  );
}

interface MidiaGaleriaCardProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain';
  onPress?: () => void;
  showBadge?: boolean;
  autoplayVideo?: boolean;
}

export function MidiaGaleriaCard({
  uri,
  style,
  imageStyle,
  resizeMode = 'cover',
  onPress,
  showBadge = true,
  autoplayVideo = true,
}: MidiaGaleriaCardProps) {
  const { theme } = useTheme();
  const stylesThemed = createStyles(theme);
  const ehVideo = isMidiaVideo(uri);
  const ehGif = isMidiaGif(uri);
  const expoVideoModule = getExpoVideoModule();

  const fallbackCard = (
    <View style={[stylesThemed.videoCaixa, style]}>
      <View style={stylesThemed.videoPoster}>
        <Camera size={28} color="rgba(255, 255, 255, 0.25)" />
      </View>
      <View style={stylesThemed.playOverlay} pointerEvents="none">
        <View style={stylesThemed.playCirculo}>
          <Play size={20} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
        </View>
      </View>
      {showBadge && (
        <View style={stylesThemed.badge}>
          <Play size={10} color="#FFFFFF" fill="#FFFFFF" />
          <Text style={stylesThemed.badgeTexto}>Vídeo</Text>
        </View>
      )}
    </View>
  );

  const content = (
    <View style={[stylesThemed.container, style]}>
      {ehVideo ? (
        autoplayVideo && expoVideoModule ? (
          <NativeVideoErrorBoundary fallback={fallbackCard}>
            <View style={stylesThemed.videoWrapper}>
              <NativeLoopPlayerWithHooks
                uri={uri}
                style={[stylesThemed.videoElement, imageStyle as any]}
                expoVideo={expoVideoModule}
              />
              {showBadge && (
                <View style={stylesThemed.badge}>
                  <Play size={10} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={stylesThemed.badgeTexto}>Vídeo</Text>
                </View>
              )}
            </View>
          </NativeVideoErrorBoundary>
        ) : (
          fallbackCard
        )
      ) : (
        <View style={stylesThemed.imageWrapper}>
          <Image
            source={{ uri }}
            style={[stylesThemed.imagem, imageStyle as any]}
            resizeMode={resizeMode}
          />
          {ehGif && showBadge && (
            <View style={[stylesThemed.badge, stylesThemed.badgeGif]}>
              <Text style={stylesThemed.badgeTexto}>GIF</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={style}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const createStyles = (theme: ThemePalette) =>
  StyleSheet.create({
    container: {
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      backgroundColor: theme.superficie,
    },
    imageWrapper: {
      width: '100%',
      height: '100%',
      position: 'relative',
    },
    imagem: {
      width: '100%',
      height: '100%',
    },
    videoWrapper: {
      width: '100%',
      height: '100%',
      position: 'relative',
      backgroundColor: '#0E0E10',
    },
    videoElement: {
      width: '100%',
      height: '100%',
    },
    videoCaixa: {
      width: '100%',
      height: '100%',
      backgroundColor: '#141418',
      position: 'relative',
      overflow: 'hidden',
    },
    videoPoster: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#181820',
    },
    playOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playCirculo: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.85)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      bottom: 8,
      left: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: Radii.full,
      borderWidth: 0.8,
      borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    badgeGif: {
      backgroundColor: 'rgba(203, 161, 74, 0.85)',
      borderColor: theme.bordaOuro,
    },
    badgeTexto: {
      fontFamily: FontFamily.bold,
      fontSize: 10,
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
  });

const styles = StyleSheet.create({
  videoView: {
    width: '100%',
    height: '100%',
  },
});
