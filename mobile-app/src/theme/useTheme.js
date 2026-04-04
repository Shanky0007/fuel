import { useColorScheme } from 'react-native';

const dark = {
  bg: '#0C0D10',
  bg2: '#13151A',
  bg3: '#1A1D25',
  bg4: '#21252F',
  text: '#F0F2F7',
  text2: '#8B91A6',
  text3: '#525869',
  border: 'rgba(255,255,255,0.06)',
  amber: '#F5A623',
  amber2: '#FFCA6B',
  amberGlow: 'rgba(245,166,35,0.18)',
  green: '#34D399',
  red: '#F87171',
  blue: '#60A5FA',
};

const light = {
  bg: '#F4F5F7',
  bg2: '#FFFFFF',
  bg3: '#EBEDF2',
  bg4: '#DDE0E8',
  text: '#0C0D10',
  text2: '#4B5068',
  text3: '#8B91A6',
  border: 'rgba(0,0,0,0.08)',
  amber: '#D4860A',
  amber2: '#F5A623',
  amberGlow: 'rgba(213,134,10,0.12)',
  green: '#059669',
  red: '#DC2626',
  blue: '#2563EB',
};

export function useTheme() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}
