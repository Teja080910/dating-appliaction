import { useContext } from 'react';
import AppContext from '../context/CreateGlobalStateContext';
import { Colors } from './colors';

export const useTheme = () => {
  const context = useContext(AppContext);
  const themeColors = context?.themeColors || Colors;
  const themeMode = context?.themeMode || 'system';
  const isDark = themeColors.background !== '#F8F9FA' && themeColors.background !== '#FFFFFF';

  return {
    colors: themeColors,
    themeColors,
    themeMode,
    isDark,
    setThemeMode: context?.setThemeMode,
  };
};

export default useTheme;
