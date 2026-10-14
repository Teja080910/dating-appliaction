import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { APP_LANGUAGES, type LanguageOption } from '../utils/languageHelper';
import { t, useTranslation } from '../i18n';

interface LanguageSelectorHeaderProps {
  color?: string;
  onSelectLanguage?: (lang: LanguageOption) => void;
}

const LanguageSelectorHeader: React.FC<LanguageSelectorHeaderProps> = ({
  color = '#FFFFFF',
  onSelectLanguage,
}) => {
  const { language, setLanguage } = useTranslation();
  const selectedLang =
    APP_LANGUAGES.find((item) => item.code === language) ?? APP_LANGUAGES[0];
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (item: LanguageOption) => {
    setLanguage(item.code);
    setModalVisible(false);
    if (onSelectLanguage) {
      onSelectLanguage(item);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.triggerBtn}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Icon name="translate" size={17} color={color} style={styles.translateIcon} />
        <Text style={[styles.triggerText, { color }]}>
          {selectedLang.name}
        </Text>
        <Icon name="chevron-down" size={18} color={color} style={styles.chevronIcon} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('common.languageselectorheader.select_language')}</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="close" size={22} color="#111827" />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={APP_LANGUAGES}
                  keyExtractor={(item) => item.code}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isSelected = item.code === selectedLang.code;
                    return (
                      <TouchableOpacity
                        style={[styles.langItem, isSelected && styles.langItemSelected]}
                        onPress={() => handleSelect(item)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.flagEmoji}>{item.flag}</Text>
                        <Text style={[styles.langName, isSelected && styles.langNameSelected]}>
                          {item.name}
                        </Text>
                        {isSelected && (
                          <Icon name="check" size={20} color="#7C3AED" style={styles.checkIcon} />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

export default LanguageSelectorHeader;

const styles = StyleSheet.create({
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  translateIcon: {
    marginRight: 6,
  },
  triggerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  chevronIcon: {
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxHeight: '75%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginVertical: 2,
  },
  langItemSelected: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  flagEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  langName: {
    fontSize: 15.5,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  langNameSelected: {
    fontWeight: '700',
    color: '#7C3AED',
  },
  checkIcon: {
    marginLeft: 8,
  },
});
