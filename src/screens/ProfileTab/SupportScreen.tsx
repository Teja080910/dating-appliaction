import React, { useMemo, useState } from 'react';
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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootParamList } from '../../utils/types/navigation.types';
import { useSupport } from '../../api/useSupport';
import { Colors, Spacing } from '../../theme';
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

  const handleOpenTelegramSupport = () => {
    const url = 'https://t.me/AmaraSupportBot';
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL('https://t.me/AmaraDatingBot');
        }
      })
      .catch(() => {
        Linking.openURL('https://t.me/AmaraDatingBot');
      });
  };

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={26} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support & Chat</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardArea}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Quick Telegram Support option */}
          <TouchableOpacity
            style={styles.telegramSupportCard}
            activeOpacity={0.8}
            onPress={handleOpenTelegramSupport}
          >
            <View style={styles.telegramIconBox}>
              <Icon name="telegram" size={26} color="#fff" />
            </View>
            <View style={styles.telegramSupportContent}>
              <Text style={styles.telegramSupportTitle}>Chat with Live Agent</Text>
              <Text style={styles.telegramSupportSub}>
                Instant support via our official Telegram bot
              </Text>
            </View>
            <Icon name="chevron-right" size={22} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR SUBMIT A TICKET</Text>
            <View style={styles.dividerLine} />
          </View>

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
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
            placeholderTextColor={Colors.textMuted}
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
              <Text style={styles.ticketTitle}>Recent Tickets</Text>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
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
    padding: Spacing.lg,
    paddingBottom: 40,
  },
  telegramSupportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 136, 204, 0.3)',
    marginBottom: Spacing.lg,
  },
  telegramIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0088cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  telegramSupportContent: {
    flex: 1,
  },
  telegramSupportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  telegramSupportSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  categoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  categoryBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    textAlignVertical: 'top',
    height: 120,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  ticketSection: {
    marginTop: Spacing.xxl,
  },
  ticketTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  stateCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    alignItems: 'center',
  },
  stateText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  ticketCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
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
    fontSize: 11,
    textTransform: 'uppercase',
  },
  ticketStatusClosed: {
    color: '#22c55e',
  },
  ticketMessage: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  ticketFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDate: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  closeLink: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
});
