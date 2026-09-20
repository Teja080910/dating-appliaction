import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import useSubscriptionGate from '../../utils/useSubscriptionGate';
import { Colors, Spacing, Shadows, Typography } from '../../theme';

const ChatDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { name, image } = route.params || { name: 'User', image: null };
  const { requireSubscription } = useSubscriptionGate();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim() === '') return;
    requireSubscription(() => {
      const newMsg = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'me',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMsg]);
      setInputText('');
    });
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[styles.msgWrapper, item.sender === 'me' ? styles.myMsgWrapper : styles.otherMsgWrapper]}>
      <View style={[styles.msgBubble, item.sender === 'me' ? styles.myBubble : styles.otherBubble]}>
        <Text style={[styles.msgText, item.sender === 'me' && styles.myMsgText]}>{item.text}</Text>
        <Text style={[styles.msgTime, item.sender === 'me' && styles.myMsgTime]}>{item.time}</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <Icon name="chat-outline" size={40} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptyDesc}>Send a message to start the conversation!</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="chevron-left" size={28} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.headerProfile}>
          {image ? (
            <Image source={{ uri: image }} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
              <Icon name="account" size={22} color={Colors.textMuted} />
            </View>
          )}
          <View>
            <Text style={styles.headerName}>{name}</Text>
            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.moreHeaderBtn}>
          <Icon name="dots-vertical" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={messages.length === 0 ? styles.emptyChatArea : styles.chatArea}
        showsVerticalScrollIndicator={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachBtn}
            onPress={() => { requireSubscription(); }}
          >
            <Feather name="plus" size={22} color={Colors.primary} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              placeholder="Messaging coming soon..."
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              multiline
              placeholderTextColor={Colors.textMuted}
              editable={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendBtn, styles.disabledSend]}
            disabled
          >
            <LinearGradient
              colors={[Colors.disabled, Colors.disabled]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sendGradient}
            >
              <Icon name="send" size={18} color={Colors.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginTop: Spacing.sm,
    borderRadius: Spacing.radiusXl,
  },
  backBtn: {
    padding: 4,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.glassBorder,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.online,
  },
  onlineText: {
    fontSize: 12,
    color: Colors.online,
    fontWeight: '600',
  },
  moreHeaderBtn: {
    padding: 4,
  },
  chatArea: {
    padding: Spacing.lg,
    paddingBottom: 30,
  },
  msgWrapper: {
    marginBottom: Spacing.lg,
    width: '100%',
  },
  myMsgWrapper: {
    alignItems: 'flex-end',
  },
  otherMsgWrapper: {
    alignItems: 'flex-start',
  },
  msgBubble: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.radiusLg,
    maxWidth: '80%',
  },
  myBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.surfaceLight,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  msgText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  myMsgText: {
    color: Colors.white,
  },
  msgTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  myMsgTime: {
    color: 'rgba(255,255,255,0.6)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xs : Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.screenPaddingHorizontal,
    marginBottom: Spacing.md,
    borderRadius: Spacing.radiusXl,
  },
  attachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.inputBackground,
    borderRadius: Spacing.radiusLg,
    paddingHorizontal: Spacing.lg,
    marginRight: Spacing.md,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  input: {
    fontSize: 15,
    color: Colors.text,
    paddingVertical: Spacing.md,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
  },
  sendGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSend: {
    opacity: 0.5,
  },
  emptyChatArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.glass,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  headerAvatarPlaceholder: {
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
