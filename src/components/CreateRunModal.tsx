import React, { useState } from 'react';
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
import { Coordinate } from '../types';
import { supabase } from '../lib/supabase';

type CreateRunModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedLocation: Coordinate | null;
  onSuccess: () => void;
};

export default function CreateRunModal({
  visible,
  onClose,
  selectedLocation,
  onSuccess,
}: CreateRunModalProps) {
  const [datetime, setDatetime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Androidは自動で閉じる
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
    // Androidは自動で閉じる
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
    // キーボードを閉じる
    Keyboard.dismiss();

    if (!selectedLocation) {
      Alert.alert('エラー', '地図上で場所を選択してください');
      return;
    }

    if (!description.trim()) {
      Alert.alert('エラー', 'トレーニング内容を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      // 現在のユーザーIDを取得
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('ユーザー認証が必要です');
      }

      const { error } = await supabase.from('runs').insert({
        user_id: user.id,
        location: `POINT(${selectedLocation.longitude} ${selectedLocation.latitude})`,
        location_name: locationName.trim() || null,
        datetime: datetime.toISOString(),
        description: description.trim(),
        note: note.trim() || null,
      });

      if (error) throw error;

      Alert.alert('成功', 'Runを投稿しました！');

      // フォームをリセット
      setDescription('');
      setLocationName('');
      setNote('');
      setDatetime(new Date());

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating run:', error);
      Alert.alert('エラー', 'Runの投稿に失敗しました');
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
              <Text style={styles.title}>Run を投稿</Text>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.form}
              keyboardShouldPersistTaps="handled"
            >
            {/* 場所 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>場所</Text>
              {selectedLocation ? (
                <View style={styles.locationInfo}>
                  <Text style={styles.locationText}>
                    📍 緯度: {selectedLocation.latitude.toFixed(4)}, 経度:{' '}
                    {selectedLocation.longitude.toFixed(4)}
                  </Text>
                </View>
              ) : (
                <Text style={styles.errorText}>地図上で場所を選択してください</Text>
              )}
              <TextInput
                style={styles.input}
                placeholder="場所の名前（任意）"
                value={locationName}
                onChangeText={setLocationName}
              />
            </View>

            {/* 日時 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>日時 *</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text>{datetime.toLocaleDateString('ja-JP')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateTimeButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text>
                    {datetime.toLocaleTimeString('ja-JP', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showDatePicker && Platform.OS === 'ios' && (
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerDoneButton}>完了</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={datetime}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  locale="ja-JP"
                  themeVariant="light"
                  textColor="#000000"
                  style={styles.picker}
                />
              </View>
            )}

            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={datetime}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            {showTimePicker && Platform.OS === 'ios' && (
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.pickerDoneButton}>完了</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={datetime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  locale="ja-JP"
                  themeVariant="light"
                  textColor="#000000"
                  style={styles.picker}
                />
              </View>
            )}

            {showTimePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={datetime}
                mode="time"
                display="default"
                onChange={handleTimeChange}
              />
            )}

            {/* トレーニング内容 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>トレーニング内容 *</Text>
              <TextInput
                style={styles.input}
                placeholder="例: 皇居周回5km"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* メモ */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>メモ（任意）</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="例: ペース 5:30/km くらい。初心者歓迎！"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={4}
              />
            </View>

            {/* 投稿ボタン */}
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? '投稿中...' : '投稿する'}
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  form: {
    padding: 20,
  },
  formGroup: {
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
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationInfo: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 8,
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
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#52C41A',
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
  pickerContainer: {
    backgroundColor: '#F6FFED',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#B7EB8F',
    marginBottom: 16,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#B7EB8F',
    backgroundColor: '#F0FFF4',
  },
  pickerDoneButton: {
    color: '#52C41A',
    fontSize: 16,
    fontWeight: '700',
  },
  picker: {
    height: 200,
    backgroundColor: '#F6FFED',
  },
});
