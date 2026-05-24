import { Platform, Text, TextInput } from 'react-native';

import { AppFont } from '@/constants/typography';

if (Platform.OS === 'android') {
  Text.defaultProps = {
    ...Text.defaultProps,
    style: [{ fontFamily: AppFont.regular, includeFontPadding: false }, Text.defaultProps?.style],
  };

  TextInput.defaultProps = {
    ...TextInput.defaultProps,
    style: { fontFamily: AppFont.regular, includeFontPadding: false },
  };
}
