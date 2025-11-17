import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Run } from '../types';
import { supabase } from '../lib/supabase';

type EditRunModalProps = {
  visible: boolean;
  onClose: () => void;
  run: Run | null;
  onSuccess: () => void;
};

export default function EditRunModal({
  visible,
  onClose,
  run,
  onSuccess,
}: EditRunModalProps) {
  const [datetime, setDatetime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // runが変更されたらフォームを更新
  useEffect(() => {
    if (run) {
      setDatetime(new Date(run.datetime));
      setDescription(run.description);
      setLocationName(run.location_name || '');
      setNote(run.note || '');
    }
  }, [run]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const newDate = new Date(datetime);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setDatetime(newDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      const newDate = new Date(datetime);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDatetime(newDate);
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();

    if (!run) {
      Alert.alert('エラー', '編集対象のRunが見つかりません');
      return;
    }

    if (!description.trim()) {
      Alert.alert('エラー', 'トレーニング内容を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('runs')
        .update({
          location_name: locationName.trim() || null,
          datetime: datetime.toISOString(),
          description: description.trim(),
          note: note.trim() || null,
        })
        .eq('id', run.id);

      if (error) throw error;

      Alert.alert('成功', 'Runを更新しました！');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating run:', error);
      Alert.alert('エラー', 'Runの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Runを編集</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.form}
              keyboardShouldPersistTaps="handled"
            >
              {/* 日時選択 */}
              <View style={styles.field}>
                <Text style={styles.label}>日時 *</Text>
                <View style={styles.dateTimeContainer}>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.dateTimeText}>
                      {datetime.toLocaleDateString('ja-JP')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.dateTimeButton}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.dateTimeText}>
                      {datetime.toLocaleTimeString('ja-JP', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={datetime}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={datetime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                />
              )}

              {/* トレーニング内容 */}
              <View style={styles.field}>
                <Text style={styles.label}>トレーニング内容 *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="例: 皇居ラン 5km ペース走"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* 場所の名前 */}
              <View style={styles.field}>
                <Text style={styles.label}>場所の名前（任意）</Text>
                <TextInput
                  style={styles.input}
                  value={locationName}
                  onChangeText={setLocationName}
                  placeholder="例: 皇居外周"
                />
              </View>

              {/* メモ */}
              <View style={styles.field}>
                <Text style={styles.label}>一言メモ（任意）</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={note}
                  onChangeText={setNote}
                  placeholder="例: 初心者歓迎！一緒に楽しく走りましょう"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* 投稿ボタン */}
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? '更新中...' : '更新する'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  dateTimeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  dateTimeText: {
    fontSize: 16,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
