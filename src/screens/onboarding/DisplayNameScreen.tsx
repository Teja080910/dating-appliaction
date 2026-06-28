import React, {useContext, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import AppContext from '../../context/CreateGlobalStateContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {Colors, Spacing, Shadows} from '../../theme';

const DisplayNameScreen = ({navigation}: any) => {
  const {name, setName, displayName, setDisplayName} = useContext(AppContext);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.setItem('onboardingStep', 'DisplayName');

      const onBackPress = () => {
        navigation.replace('GenderOrientation');
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => backHandler.remove();
    }, [navigation]),
  );

  const currentName = displayName || name || '';

  const handleDisplayName = async () => {
    if (!currentName.trim()) return;

    const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

    if (isLoggedIn === 'true') {
      navigation.navigate('UploadImage');
    } else {
      navigation.navigate('DOB');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            style={{flex: 1}}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.content}>
              <Text style={styles.title}>Welcome to AMARA!</Text>
              <Text style={styles.subtitle}>Please choose a display name!</Text>

              <View style={styles.inputBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter name"
                  placeholderTextColor={Colors.textMuted}
                  value={currentName}
                  onChangeText={text => {
                    setDisplayName(text);
                    setName(text);
                  }}
                  autoFocus
                />
              </View>

              <View style={styles.spacer} />

              <TouchableOpacity
                style={[styles.btn, !currentName.trim() && {opacity: 0.5}]}
                disabled={!currentName.trim()}
                onPress={handleDisplayName}>
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.btnGradient}>
                  <Text style={styles.btnText}>Next</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default DisplayNameScreen;

const styles = StyleSheet.create({
  container: {flex: 1},
  gradient: {flex: 1},
  safeArea: {flex: 1},
  content: {flex: 1, padding: Spacing.xl, justifyContent: 'center'},
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: Spacing.lg,
  },
  input: {
    paddingVertical: Spacing.lg,
    fontSize: 16,
    color: Colors.text,
  },
  spacer: {flex: 1},
  btn: {
    borderRadius: Spacing.radiusFull,
    overflow: 'hidden',
    ...Shadows.md,
  },
  btnGradient: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: Colors.white,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
