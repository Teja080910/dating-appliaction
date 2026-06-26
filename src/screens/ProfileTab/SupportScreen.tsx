import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParamList } from '../../utils/types/navigation.types';
import { useSupport } from '../../api/useSupport';
import { Colors } from '../../utils/colors';
import { useAlert } from '../../components/AlertModal';

const SupportScreen = () => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technical');

  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const { alert, AlertComponent } = useAlert();
  const {
    createTicket,
    tickets,
    isLoadingTickets,
    isFetchingTickets,
    ticketsError,
    closeTicket,
    getSupportErrorMessage,
  } = useSupport(undefined);

  const recentTickets = useMemo(
    () => [...tickets].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))).slice(0, 5),
    [tickets],
  );

  const handleSubmit = () => {
    if (!description.trim()) {
      alert('Error', 'Please describe your issue.');
      return;
    }

    createTicket.mutate(
      {
        subject: category,
        message: description.trim(),
      },
      {
        onSuccess: () => {
          alert('Success', 'Your support ticket has been created.');
          setDescription('');
        },
        onError: (error: any) => {
          alert(
            'Error',
            String(getSupportErrorMessage(error, 'Failed to create ticket. Please try again.')),
          );
        },
      },
    );
  };

  const handleCloseTicket = (ticketId: number) => {
    alert('Close Ticket', 'Mark this support ticket as closed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close',
        onPress: () => {
          closeTicket.mutate(ticketId, {
            onSuccess: () => {
              alert('Ticket Closed', 'The support ticket has been marked as closed.');
            },
            onError: (error: any) => {
              alert(
                'Close Failed',
                String(getSupportErrorMessage(error, 'Unable to close this ticket right now.')),
              );
            },
          });
        },
      },
    ]);
  };

  const categories = ['Technical', 'Billing', 'Report User', 'Other'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support Center</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardArea}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryBtn,
                  category === cat && styles.categoryBtnActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Tell us what's wrong</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe your issue in detail..."
            multiline
            numberOfLines={6}
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={createTicket.isPending}
          >
            {createTicket.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Ticket</Text>
            )}
          </TouchableOpacity>

          <View style={styles.ticketSection}>
            <View style={styles.ticketTitleRow}>
              <Text style={styles.ticketTitle}>Recent tickets</Text>
              {isFetchingTickets ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
            </View>

            {isLoadingTickets ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : ticketsError ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateText}>{ticketsError}</Text>
              </View>
            ) : recentTickets.length === 0 ? (
              <View style={styles.stateCard}>
                <Text style={styles.stateText}>No support tickets yet.</Text>
              </View>
            ) : (
              recentTickets.map((ticket) => {
                const isClosed = ticket.status === 'CLOSED';
                return (
                  <View key={ticket.id} style={styles.ticketCard}>
                    <View style={styles.ticketHeader}>
                      <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                      <Text style={[styles.ticketStatus, isClosed ? styles.ticketStatusClosed : null]}>
                        {ticket.status}
                      </Text>
                    </View>
                    <Text numberOfLines={3} style={styles.ticketMessage}>{ticket.message}</Text>
                    <View style={styles.ticketFooter}>
                      <Text style={styles.ticketDate}>
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : 'Just now'}
                      </Text>
                      {!isClosed ? (
                        <TouchableOpacity onPress={() => handleCloseTicket(ticket.id)}>
                          <Text style={styles.closeLink}>Close</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.infoBox}>
            <Icon name="information-outline" size={20} color="#666" />
            <Text style={styles.infoText}>
              Our team usually responds within 24 hours. You'll receive a notification when we reply.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {AlertComponent}
    </SafeAreaView>
  );
};

export default SupportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSpacer: {
    width: 28,
  },
  keyboardArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 10,
    marginTop: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 10,
    marginBottom: 10,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: Colors.text,
    textAlignVertical: 'top',
    height: 150,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    shadowColor: Colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  ticketSection: {
    marginTop: 28,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  stateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
  },
  stateText: {
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  ticketCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 12,
  },
  ticketSubject: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
  ticketStatus: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  ticketStatusClosed: {
    color: '#4CAF50',
  },
  ticketMessage: {
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  ticketFooter: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDate: {
    color: Colors.grey,
    fontSize: 12,
  },
  closeLink: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: Colors.lightGrey,
    padding: 15,
    borderRadius: 12,
    marginTop: 40,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 10,
    lineHeight: 18,
  },
});
