import { Platform, type TextStyle } from 'react-native';

export const AppFont = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
  black: 'Inter_900Black',
} as const;

function resolveFontFamily(weight: TextStyle['fontWeight'] = '400'): string {
  const normalized = String(weight);

  if (normalized === '900' || normalized === '800') {
    return AppFont.black;
  }
  if (normalized === '700' || normalized === 'bold') {
    return AppFont.bold;
  }
  if (normalized === '600') {
    return AppFont.semiBold;
  }
  if (normalized === '500') {
    return AppFont.medium;
  }

  return AppFont.regular;
}

/** Maps numeric fontWeight to Inter files on Android (Roboto ignores 800/900). */
export function appText(style: TextStyle = {}): TextStyle {
  if (Platform.OS !== 'android') {
    return style;
  }

  const { fontWeight, ...rest } = style;

  return {
    ...rest,
    fontFamily: resolveFontFamily(fontWeight),
    includeFontPadding: false,
  };
}
