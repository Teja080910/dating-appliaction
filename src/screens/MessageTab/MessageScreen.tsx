import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Dimensions,
  TextInput,
  StatusBar
} from 'react-native';
import AvatarGroup from '../../components/MessageTabComponents/AvatarGroup';
import InviteButton from '../../components/MessageTabComponents/InviteButton';
import { getGender } from '../../utils/types/AsyncStorage';
import AppContext from '../../context/CreateGlobalStateContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mock Messages Data
const MOCK_CHATS = [
    { id: '1', name: 'Alisha', lastMsg: 'I really like your profile!', time: '10:15 AM', unread: 2, image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format' },
    { id: '2', name: 'Sneha', lastMsg: 'Are you from Mumbai originally?', time: 'Yesterday', unread: 0, image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format' },
    { id: '3', name: 'Pooja', lastMsg: 'Sent you a heart!', time: 'Tue', unread: 1, image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=500&auto=format' },
];

const MOCK_RECEIVED = [
    { id: 'rec1', name: 'Kavita', age: 23, time: '2h ago', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&auto=format' },
];

export default function MessageScreen() {
  const navigation = useNavigation<any>();
  const { oppositeGender, setOppositeGender, invitations } = useContext(AppContext);
  const [activeMainTab, setActiveMainTab] = useState<'Invitations' | 'Messages'>('Invitations');
  const [activeInviteTab, setActiveInviteTab] = useState<'Sent' | 'Received'>('Sent');

  useEffect(() => {
    const fetchGender = async () => {
      const gender = await getGender();
      if (gender === 'straight_woman') {
        setOppositeGender('straight_man');
      } else if (gender === 'straight_man') {
        setOppositeGender('straight_woman');
      } else {
        setOppositeGender('lgbtqia');
      }
    };
    fetchGender();
  }, []);

  const isLookingForWoman = oppositeGender === 'straight_woman';

  const renderInviteItem = ({ item }: { item: any }) => (
    <View style={styles.listItem}>
        <View style={styles.avatarBox}>
            {item.image ? <Image source={{ uri: item.image }} style={styles.avatar} /> : <View style={styles.placeholderAvatar}><Icon name="account" size={30} color="#ccc" /></View>}
            <View style={styles.onlineDot} />
        </View>
        <View style={styles.itemContent}>
            <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}, {item.age}</Text>
                <Text style={styles.itemTime}>{item.time || 'now'}</Text>
            </View>
            <View style={styles.itemStatusRow}>
                <Icon name="clock-check-outline" size={14} color="#FF5A79" />
                <Text style={styles.itemStatusLabel}>{activeInviteTab === 'Sent' ? (item.status || 'Pending') : 'Invited you'}</Text>
            </View>
        </View>
        <TouchableOpacity style={styles.actionPill}>
            <Text style={styles.actionPillText}>{activeInviteTab === 'Sent' ? 'Recall' : 'Accept'}</Text>
        </TouchableOpacity>
    </View>
  );

  const renderChatItem = ({ item }: { item: any }) => (
      <TouchableOpacity 
        style={styles.listItem} 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ChatDetailScreen', { name: item.name, image: item.image })}
      >
          <View style={styles.avatarBox}>
              <Image source={{ uri: item.image }} style={styles.avatar} />
              <View style={styles.onlineDot} />
          </View>
          <View style={styles.itemContent}>
              <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemTime}>{item.time}</Text>
              </View>
              <Text style={[styles.lastMsg, item.unread > 0 && styles.unreadMsg]} numberOfLines={1}>
                  {item.lastMsg}
              </Text>
          </View>
          {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{item.unread}</Text>
              </View>
          )}
      </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Top Main Navigation */}
      <View style={styles.mainNav}>
          <TouchableOpacity 
            style={[styles.navBtn, activeMainTab === 'Invitations' && styles.activeNavBtn]}
            onPress={() => setActiveMainTab('Invitations')}
          >
              <Icon name="email-outline" size={26} color={activeMainTab === 'Invitations' ? '#FF5A79' : '#999'} />
              <Text style={[styles.navText, activeMainTab === 'Invitations' && styles.activeNavText]}>Invitations</Text>
              {activeMainTab === 'Invitations' && <View style={styles.navIndicator} />}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.navBtn, activeMainTab === 'Messages' && styles.activeNavBtn]}
            onPress={() => setActiveMainTab('Messages')}
          >
              <Icon name="chat-processing-outline" size={26} color={activeMainTab === 'Messages' ? '#FF5A79' : '#999'} />
              <Text style={[styles.navText, activeMainTab === 'Messages' && styles.activeNavText]}>Messages</Text>
              {activeMainTab === 'Messages' && <View style={styles.navIndicator} />}
          </TouchableOpacity>
      </View>

      <View style={styles.content}>
          {activeMainTab === 'Invitations' ? (
              <View style={{ flex: 1 }}>
                  {/* Secondary Invitation Tabs */}
                  <View style={styles.subTabs}>
                      <TouchableOpacity onPress={() => setActiveInviteTab('Sent')} style={[styles.subTab, activeInviteTab === 'Sent' && styles.activeSubTab]}>
                        <Text style={[styles.subTabText, activeInviteTab === 'Sent' && styles.activeSubTabText]}>Sent ({invitations.length})</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setActiveInviteTab('Received')} style={[styles.subTab, activeInviteTab === 'Received' && styles.activeSubTab]}>
                        <Text style={[styles.subTabText, activeInviteTab === 'Received' && styles.activeSubTabText]}>Received ({MOCK_RECEIVED.length})</Text>
                      </TouchableOpacity>
                  </View>

                  {(activeInviteTab === 'Sent' ? invitations.length : MOCK_RECEIVED.length) > 0 ? (
                      <FlatList
                        data={activeInviteTab === 'Sent' ? invitations : MOCK_RECEIVED}
                        renderItem={renderInviteItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                      />
                  ) : (
                      <View style={styles.emptyView}>
                          <AvatarGroup />
                          <Text style={styles.emptyTitle}>No invitations yet</Text>
                          <Text style={styles.emptyDesc}>Invite people you like to start a conversation!</Text>
                          <View style={{ width: '80%', marginTop: 20 }}><InviteButton /></View>
                      </View>
                  )}
              </View>
          ) : (
              <View style={{ flex: 1 }}>
                  {/* Search Bar for Messages */}
                  <View style={styles.searchContainer}>
                      <Icon name="magnify" size={22} color="#AAA" />
                      <TextInput placeholder="Search messages..." style={styles.searchInput} placeholderTextColor="#BBB" />
                  </View>

                  <FlatList
                    data={MOCK_CHATS}
                    renderItem={renderChatItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                  />
              </View>
          )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainNav: {
    flexDirection: 'row',
    height: 75,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#fff',
  },
  navBtn: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 3,
      position: 'relative',
  },
  navText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
  },
  activeNavText: {
    color: '#FF5A79',
  },
  navIndicator: {
      position: 'absolute',
      bottom: 0,
      width: '40%',
      height: 3,
      backgroundColor: '#FF5A79',
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
  },
  activeNavBtn: {},
  content: {
    flex: 1,
  },
  subTabs: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingTop: 20,
      gap: 25,
      marginBottom: 10,
  },
  subTab: {
      paddingBottom: 8,
  },
  activeSubTab: {
      borderBottomWidth: 2,
      borderBottomColor: '#FF5A79',
  },
  subTabText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#AAA',
  },
  activeSubTabText: {
      color: '#000',
      fontWeight: '800',
  },
  listContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 40,
  },
  listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#F9F9F9',
  },
  avatarBox: {
      position: 'relative',
  },
  avatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: '#f5f5f5',
  },
  placeholderAvatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: '#F9F9F9',
      justifyContent: 'center',
      alignItems: 'center',
  },
  onlineDot: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#2ECC71',
      borderWidth: 2,
      borderColor: '#fff',
  },
  itemContent: {
      flex: 1,
      marginLeft: 15,
      justifyContent: 'center',
  },
  itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 3,
  },
  itemName: {
      fontSize: 16,
      fontWeight: '800',
      color: '#000',
  },
  itemTime: {
      fontSize: 12,
      color: '#AAA',
      fontWeight: '600',
  },
  itemStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
  },
  itemStatusLabel: {
      fontSize: 13,
      color: '#FF5A79',
      fontWeight: '700',
  },
  lastMsg: {
      fontSize: 14,
      color: '#888',
      marginTop: 2,
  },
  unreadMsg: {
      color: '#000',
      fontWeight: '800',
  },
  unreadBadge: {
      backgroundColor: '#FF5A79',
      width: 22,
      height: 22,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
  },
  unreadCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionPill: {
      backgroundColor: '#F8F8F8',
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
  },
  actionPillText: {
      fontSize: 12,
      color: '#000',
      fontWeight: '800',
  },
  searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F7F7F7',
      margin: 20,
      paddingHorizontal: 15,
      borderRadius: 25,
      height: 48,
  },
  searchInput: {
      flex: 1,
      marginLeft: 10,
      fontSize: 15,
      color: '#000',
  },
  emptyView: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 60,
  },
  emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#000',
      marginTop: 20,
  },
  emptyDesc: {
      fontSize: 14,
      color: '#999',
      textAlign: 'center',
      paddingHorizontal: 50,
      marginTop: 8,
  }
});
