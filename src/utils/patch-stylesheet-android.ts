import { Platform, StyleSheet, type TextStyle } from 'react-native';

import { appText } from '@/constants/typography';

function shouldPatchStyle(style: unknown): style is TextStyle {
  return (
    Boolean(style) &&
    typeof style === 'object' &&
    !Array.isArray(style) &&
    ('fontWeight' in style || 'fontStyle' in style || 'fontSize' in style)
  );
}

if (Platform.OS === 'android') {
  const originalCreate = StyleSheet.create;

  StyleSheet.create = function patchedCreate<T extends StyleSheet.NamedStyles<T>>(styles: T): T {
    const patchedStyles = {} as T;

    for (const key of Object.keys(styles) as Array<keyof T>) {
      const style = styles[key];

      if (shouldPatchStyle(style) && style.fontWeight !== undefined) {
        patchedStyles[key] = appText(style) as T[keyof T];
      } else {
        patchedStyles[key] = style;
      }
    }

    return originalCreate(patchedStyles);
  };
}
