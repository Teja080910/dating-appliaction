import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import AppContext from '../../context/CreateGlobalStateContext';
import { connectionsApi } from '../../api/connectionsApi';
import { profileApi } from '../../api/profileApi';
import { AuthStorage } from '../../api/authStorage';
import { ConnectionRequest } from '../../api/types';

export default function InvitationsScreen() {
  const { setOppositeGender } = useContext(AppContext);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userIdNum, setUserIdNum] = useState<number | null>(null);
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
      const id = await AuthStorage.getUserId();
      setUserIdNum(id);
      if (id) {
        const all: ConnectionRequest[] = [];
        try {
          const received = await connectionsApi.getReceivedRequests(id);
          all.push(...(received || []));
        } catch {}
        try {
          const sent = await connectionsApi.getSentRequests(id);
          all.push(...(sent || []));
        } catch {}
        all.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setRequests(all);
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchGenderAndRequests().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGenderAndRequests();
    setRefreshing(false);
  };

  const handleAccept = async (requestId: number) => {
    try {
      if (!userIdNum) return;
      await connectionsApi.acceptRequest({ requestId, userId: userIdNum });
      Alert.alert('Accepted', 'You have accepted the request');
      onRefresh();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleDecline = async (requestId: number) => {
    try {
      if (!userIdNum) return;
      await connectionsApi.declineRequest({ requestId, userId: userIdNum });
      Alert.alert('Declined', 'Request has been declined');
      onRefresh();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to decline request');
    }
  };

  const handleCancel = async (requestId: number) => {
    try {
      if (!userIdNum) return;
      await connectionsApi.cancelRequest({ requestId, userId: userIdNum });
      Alert.alert('Cancelled', 'Request has been cancelled');
      onRefresh();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel request');
    }
  };



  const renderRequestItem = ({ item }: { item: ConnectionRequest }) => {
    const isReceived = item.receiver?.id === userIdNum;
    const otherUser = isReceived ? item.sender : item.receiver;
    const otherName = otherUser?.name || otherUser?.profile?.displayName || 'Unknown';
    const otherImage = otherUser?.profile?.profileImageUrl || '';

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestRow}>
          {otherImage ? (
            <Image source={{ uri: otherImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{otherName.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.requestInfo}>
            <Text style={styles.requestName}>{otherName}</Text>
            <Text style={styles.requestStatus}>Status: {item.status}</Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          {isReceived && item.status === 'PENDING' && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={() => handleAccept(item.id)}>
                <Text style={styles.actionBtnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.declineBtn]}
                onPress={() => handleDecline(item.id)}>
                <Text style={styles.actionBtnText}>Decline</Text>
              </TouchableOpacity>
            </>
          )}
          {!isReceived && item.status === 'PENDING' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={() => handleCancel(item.id)}>
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
