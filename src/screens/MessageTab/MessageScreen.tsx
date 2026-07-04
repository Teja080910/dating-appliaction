import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppContext from '../../context/CreateGlobalStateContext';
import { connectionsApi } from '../../api/connectionsApi';
import { profileApi } from '../../api/profileApi';
import AuthImage from '../../components/AuthImage';
import { resolveImageUri } from '../../utils/imageUtils';
import { AuthStorage } from '../../api/authStorage';
import { ConnectionRequest } from '../../api/types';

export default function InvitationsScreen() {
  const { setOppositeGender } = useContext(AppContext);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [userGender, setUserGender] = useState<string | null>(null);

  const fetchGenderAndRequests = useCallback(async () => {
    try {
      const userIdStr = await AuthStorage.getUserIdStr();
      if (userIdStr) {
        const profile = await profileApi.getMyProfile(userIdStr);
        const gender = profile?.gender || '';
        setUserGender(gender);
        if (gender === 'female') {
          setOppositeGender('male');
        } else if (gender === 'male') {
          setOppositeGender('female');
        } else {
          setOppositeGender('other');
        }
      }
    } catch {
      try {
        const userData = await AuthStorage.getUser();
        const gender = userData?.gender || '';
        setUserGender(gender);
        if (gender === 'female') {
          setOppositeGender('male');
        } else if (gender === 'male') {
          setOppositeGender('female');
        } else {
          setOppositeGender('other');
        }
      } catch {}
    }

    try {
      const userData = await AuthStorage.getUser();
      const id = userData?.userId || (await AuthStorage.getUserIdStr());
      setMyUserId(id);
      if (id) {
        const all: ConnectionRequest[] = [];
        try {
          const received = await connectionsApi.getReceivedRequests(id);
          const receivedData = Array.isArray(received) ? received : received?.data || received?.content || received?.requests || [];
          all.push(...receivedData);
        } catch (e) {
          console.error('getReceivedRequests failed:', e);
        }
        try {
          const sent = await connectionsApi.getSentRequests(id);
          const sentData = Array.isArray(sent) ? sent : sent?.data || sent?.content || sent?.requests || [];
          all.push(...sentData);
        } catch (e) {
          console.error('getSentRequests failed:', e);
        }
        const seen = new Set<number>();
        const unique = all.filter(item => {
          const key = item.id;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setRequests(unique);
      }
    } catch (err) {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchGenderAndRequests().finally(() => setLoading(false));
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGenderAndRequests();
    setRefreshing(false);
  };

  const handleAccept = async (requestId: string) => {
    try {
      if (!myUserId) return;
      await connectionsApi.acceptRequest({ requestId, userId: myUserId });
      Alert.alert('Accepted', 'You have accepted the request');
      onRefresh();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      if (!myUserId) return;
      await connectionsApi.declineRequest({ requestId, userId: myUserId });
      Alert.alert('Declined', 'Request has been declined');
      onRefresh();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to decline request');
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      if (!myUserId) return;
      await connectionsApi.cancelRequest({ requestId, userId: myUserId });
      Alert.alert('Cancelled', 'Request has been cancelled');
      onRefresh();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel request');
    }
  };

  const isFemale = userGender === 'female';
  const isMale = userGender === 'male';

  const renderRequestItem = ({ item }: { item: ConnectionRequest }) => {
    const isReceived = item.receiver?.userId === myUserId || item.receiver?.id === Number(myUserId);
    const otherUser = isReceived ? item.sender : item.receiver;
    const otherName = otherUser?.name || otherUser?.profile?.displayName || otherUser?.profile?.name || otherUser?.userId || 'Unknown';
    const otherImage = otherUser?.profile?.profileImageUrl || '';
    const statusText = item.status || 'PENDING';

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestRow}>
          {otherImage ? (
            <AuthImage uri={resolveImageUri(otherImage)} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{otherName.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>{otherName}</Text>
            <Text style={styles.requestStatus}>Status: {statusText}</Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          {isFemale && isReceived && item.status === 'PENDING' && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={() => handleAccept(String(item.id))}>
                <Text style={styles.actionBtnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.declineBtn]}
                onPress={() => handleDecline(String(item.id))}>
                <Text style={styles.actionBtnText}>Decline</Text>
              </TouchableOpacity>
            </>
          )}
          {isMale && !isReceived && item.status === 'PENDING' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={() => handleCancel(String(item.id))}>
              <Text style={styles.actionBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#D94B58" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/MessageTabImages/envelope.png')} style={styles.icon} />
        <Text style={styles.title}>Invitations</Text>
      </View>

      {requests.length > 0 ? (
        <FlatList
          data={requests}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderRequestItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <Text style={styles.message}>
          No invitations yet.{'\n'}
          Discover people and send invitations!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: { width: 30, height: 30, marginRight: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  message: {
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    marginVertical: 20,
    fontWeight: '500',
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  listContent: { paddingBottom: 100 },
  requestCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  requestRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: {
    backgroundColor: '#D94B58',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  requestInfo: { marginLeft: 12, flex: 1 },
  requestName: { fontSize: 16, fontWeight: '600', color: '#000' },
  requestStatus: { fontSize: 12, color: '#888', marginTop: 4 },
  actionRow: { flexDirection: 'row', marginTop: 12, gap: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptBtn: { backgroundColor: '#4CAF50' },
  declineBtn: { backgroundColor: '#f44336' },
  cancelBtn: { backgroundColor: '#FF9800' },
  actionBtnText: { color: '#fff', fontWeight: '600' },
});
