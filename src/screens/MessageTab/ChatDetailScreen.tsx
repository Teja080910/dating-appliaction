import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import AppContext from '../../context/CreateGlobalStateContext';

const ChatDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { name, image } = route.params || { name: 'Alisha', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format' };
  
  const { isSubscribed, setPaywallVisible } = useContext(AppContext);

  const [messages, setMessages] = useState([
    { id: '1', text: 'Hey there! How is your day going?', sender: 'other', time: '10:15 AM' },
    { id: '2', text: 'It is going great, thank you for asking! How about yours?', sender: 'me', time: '10:18 AM' },
    { id: '3', text: 'Pretty busy, but saw your profile and had to say hi.', sender: 'other', time: '10:20 AM' },
  ]);

  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    // PAYWALL CHECK
    if (!isSubscribed) {
        setPaywallVisible(true);
        return;
    }

    if (inputText.trim() === '') return;
    
    const newMsg = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newMsg]);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[styles.msgWrapper, item.sender === 'me' ? styles.myMsgWrapper : styles.otherMsgWrapper]}>
        <View style={[styles.msgBubble, item.sender === 'me' ? styles.myBubble : styles.otherBubble]}>
            <Text style={[styles.msgText, item.sender === 'me' && styles.myMsgText]}>{item.text}</Text>
            <Text style={[styles.msgTime, item.sender === 'me' && styles.myMsgTime]}>{item.time}</Text>
        </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Custom Header */}
      <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="chevron-left" size={28} color="#000" />
          </TouchableOpacity>
          
          <View style={styles.headerProfile}>
              <Image source={{ uri: image }} style={styles.headerAvatar} />
              <View>
                  <Text style={styles.headerName}>{name}</Text>
                  <View style={styles.onlineStatus}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.onlineText}>Online</Text>
                  </View>
              </View>
          </View>
          
          <TouchableOpacity style={styles.moreHeaderBtn}>
              <Icon name="dots-vertical" size={24} color="#666" />
          </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatArea}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
          <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.attachBtn} onPress={() => setPaywallVisible(true)}>
                  <Feather name="plus" size={24} color="#FF5A79" />
              </TouchableOpacity>
              
              <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="Type a message..."
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                    placeholderTextColor="#AAA"
                  />
              </View>

              <TouchableOpacity 
                style={[styles.sendBtn, inputText.trim() === '' && styles.disabledSend]} 
                onPress={sendMessage}
              >
                  <Icon name="send" size={20} color="#fff" />
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
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#fff',
  },
  backBtn: {
      padding: 5,
  },
  headerProfile: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 10,
  },
  headerAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      marginRight: 12,
  },
  headerName: {
      fontSize: 18,
      fontWeight: '800',
      color: '#000',
  },
  onlineStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
  },
  onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#2ECC71',
  },
  onlineText: {
      fontSize: 12,
      color: '#2ECC71',
      fontWeight: '600',
  },
  moreHeaderBtn: {
      padding: 5,
  },
  chatArea: {
      padding: 20,
      paddingBottom: 30,
  },
  msgWrapper: {
      marginBottom: 20,
      width: '100%',
  },
  myMsgWrapper: {
      alignItems: 'flex-end',
  },
  otherMsgWrapper: {
      alignItems: 'flex-start',
  },
  msgBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '80%',
    position: 'relative',
  },
  myBubble: {
    backgroundColor: '#FF5A79',
    borderTopRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F3F3F3',
    borderTopLeftRadius: 4,
  },
  msgText: {
      fontSize: 15,
      color: '#222',
      lineHeight: 20,
      fontWeight: '500',
  },
  myMsgText: {
      color: '#fff',
  },
  msgTime: {
      fontSize: 10,
      color: '#AAA',
      marginTop: 5,
      textAlign: 'right',
  },
  myMsgTime: {
      color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      paddingBottom: Platform.OS === 'ios' ? 0 : 20,
      borderTopWidth: 1,
      borderTopColor: '#EEEEEE',
      backgroundColor: '#fff',
  },
  attachBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FFF2F4',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
  },
  inputWrapper: {
      flex: 1,
      backgroundColor: '#F8F8F8',
      borderRadius: 25,
      paddingHorizontal: 15,
      marginRight: 10,
      maxHeight: 100,
  },
  input: {
      fontSize: 15,
      color: '#000',
      paddingVertical: 10,
  },
  sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FF5A79',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#FF5A79',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 5,
  },
  disabledSend: {
      backgroundColor: '#EBD0D4',
      shadowOpacity: 0,
      elevation: 0,
  }
});
