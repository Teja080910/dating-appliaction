import { useMutation } from '@tanstack/react-query';
import { authApi } from './authApi';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootParamList } from '../utils/types/navigation.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthStorage } from './authStorage';
import { Alert } from 'react-native';

export const useLoginMutation = () => {
  const navigation = useNavigation<StackNavigationProp<RootParamList>>();

  return useMutation({
    mutationFn: (data: { mobile: string; password: string }) =>
      authApi.login(data),

    onSuccess: async (data) => {
      await AuthStorage.setUser(data);
      if (data.token) {
        await AuthStorage.setToken(data.token);
      }
      if (data.userId) {
        await AsyncStorage.setItem('user_id', data.userId);
      }
      if (data.ID) {
        await AsyncStorage.setItem('user_id_num', String(data.ID));
      }
      await AsyncStorage.setItem('user_data', JSON.stringify(data));
      await AsyncStorage.setItem('entryHomeScreen', 'true');
      navigation.replace('BottomTabs');
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Invalid mobile number or password';
      Alert.alert('Login Failed', msg);
    },
  });
};
