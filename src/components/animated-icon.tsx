import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { AppFont } from '@/constants/typography';

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const textSlideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(textSlideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(700),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  }, [fadeAnim, overlayOpacity, scaleAnim, textSlideAnim]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.backgroundSolidColor, { opacity: overlayOpacity }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logoImage}
          contentFit="contain"
        />

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: textSlideAnim }],
            },
          ]}
        >
          <View style={styles.logoTextRow}>
            <Animated.Text style={styles.logoText}>ARENAS</Animated.Text>
            <Animated.Text style={[styles.logoText, styles.logoTextOrange]}> 360</Animated.Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backgroundSolidColor: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#001529',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  textContainer: {
    alignItems: 'center',
  },
  logoTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontFamily: AppFont.black,
    fontStyle: 'italic',
    letterSpacing: 1.2,
  },
  logoTextOrange: {
    color: '#FF9F1C',
  },
});
