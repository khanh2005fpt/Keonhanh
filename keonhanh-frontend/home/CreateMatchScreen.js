import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../auth/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function CreateMatchScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({
    teamName: '',
    location: '',
    fieldName: '',
    playTime: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [dateObj, setDateObj] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');

  const showMode = (currentMode) => {
    setShowPicker(true);
    setPickerMode(currentMode);
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dateObj;
    setShowPicker(Platform.OS === 'ios'); 
    setDateObj(currentDate);
    
    const hh = currentDate.getHours().toString().padStart(2, '0');
    const min = currentDate.getMinutes().toString().padStart(2, '0');
    const dd = currentDate.getDate().toString().padStart(2, '0');
    const mm = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = currentDate.getFullYear();
    
    handleChange('playTime', `${hh}:${min} ${dd}/${mm}/${yyyy}`);
  };

  const parseDate = (inputStr) => {
    // Support "DD/MM/YYYY" or "HH:mm DD/MM/YYYY"
    const str = inputStr.trim();
    if (str.includes(' ')) {
      // "HH:mm DD/MM/YYYY"
      const [timePart, datePart] = str.split(' ');
      const [hh, min] = timePart.split(':');
      const parts = datePart.split('/');
      if (parts.length !== 3 || !hh || !min) return null;
      const [dd, mm, yyyy] = parts;
      const date = new Date(yyyy, mm - 1, dd, hh, min);
      return isNaN(date.getTime()) ? null : date;
    } else {
      // "DD/MM/YYYY"
      const parts = str.split('/');
      if (parts.length !== 3) return null;
      const [dd, mm, yyyy] = parts;
      // Dùng cú pháp local để không bị lùi múi giờ
      const date = new Date(yyyy, mm - 1, dd);
      return isNaN(date.getTime()) ? null : date;
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.teamName.trim()) newErrors.teamName = 'Vui lòng nhập tên đội bóng';
    if (!form.location.trim()) newErrors.location = 'Vui lòng nhập địa điểm';
    if (!form.fieldName.trim()) newErrors.fieldName = 'Vui lòng nhập tên sân';
    if (!form.playTime.trim()) {
      newErrors.playTime = 'Vui lòng nhập ngày thi đấu';
    } else {
      const date = parseDate(form.playTime);
      if (!date) {
        newErrors.playTime = 'Định dạng không hợp lệ. VD: 15/07/2025 hoặc 19:30 15/07/2025';
      } else if (date <= new Date()) {
        newErrors.playTime = 'Ngày thi đấu phải lớn hơn ngày hiện tại';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateMatch = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: form.teamName.trim(),
          location: form.location.trim(),
          fieldName: form.fieldName.trim(),
          playTime: parseDate(form.playTime).toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('🎉 Thành công', data.message || 'Đăng kèo thành công!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('❌ Lỗi', data.message || 'Không thể tạo kèo. Thử lại!');
      }
    } catch (err) {
      Alert.alert('❌ Lỗi kết nối', 'Không thể kết nối đến server. Kiểm tra lại mạng!');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#22c55e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo kèo mới ⚽</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="football" size={36} color="white" />
            </View>
            <Text style={styles.heroTitle}>Đăng kèo tìm đối thủ</Text>
            <Text style={styles.heroSubtitle}>
              Điền thông tin trận đấu để ghép kèo ngay!
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>


            {/* teamName */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                <Ionicons name="shield" size={14} color="#22c55e" /> Tên đội bóng
              </Text>
              <TextInput
                style={[styles.input, errors.teamName && styles.inputError]}
                placeholder="VD: FC Rồng Vàng"
                placeholderTextColor="#aaa"
                value={form.teamName}
                onChangeText={(v) => handleChange('teamName', v)}
              />
              {errors.teamName ? (
                <Text style={styles.errorText}>{errors.teamName}</Text>
              ) : null}
            </View>

            {/* location */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                <Ionicons name="location" size={14} color="#22c55e" /> Địa điểm
              </Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                placeholder="VD: Quận 1, TP.HCM"
                placeholderTextColor="#aaa"
                value={form.location}
                onChangeText={(v) => handleChange('location', v)}
              />
              {errors.location ? (
                <Text style={styles.errorText}>{errors.location}</Text>
              ) : null}
            </View>

            {/* fieldName */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                <Ionicons name="business" size={14} color="#22c55e" /> Tên sân bóng
              </Text>
              <TextInput
                style={[styles.input, errors.fieldName && styles.inputError]}
                placeholder="VD: Sân Phú Thọ"
                placeholderTextColor="#aaa"
                value={form.fieldName}
                onChangeText={(v) => handleChange('fieldName', v)}
              />
              {errors.fieldName ? (
                <Text style={styles.errorText}>{errors.fieldName}</Text>
              ) : null}
            </View>

            {/* playTime */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                <Ionicons name="time" size={14} color="#22c55e" /> Thời gian thi đấu
              </Text>

              <TouchableOpacity
                style={[styles.input, { justifyContent: 'center' }, errors.playTime && styles.inputError]}
                onPress={() => showMode('date')}
              >
                <Text style={{ color: form.playTime ? '#0f172a' : '#aaa' }}>
                  {form.playTime || "Chạm để chọn Ngày/Giờ"}
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                <TouchableOpacity onPress={() => showMode('date')} style={styles.pickBtn}>
                  <Ionicons name="calendar-outline" size={16} color="white" />
                  <Text style={styles.pickBtnText}>Chọn ngày</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => showMode('time')} style={styles.pickBtn}>
                  <Ionicons name="time-outline" size={16} color="white" />
                  <Text style={styles.pickBtnText}>Chọn giờ</Text>
                </TouchableOpacity>
              </View>

              {showPicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={dateObj}
                  mode={pickerMode}
                  is24Hour={true}
                  display="default"
                  onChange={onDateChange}
                />
              )}
              {errors.playTime ? (
                <Text style={styles.errorText}>{errors.playTime}</Text>
              ) : null}
            </View>

            {/* Info box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color="#3b82f6" />
              <Text style={styles.infoText}>
                Kèo sẽ có trạng thái <Text style={{ fontWeight: 'bold' }}>"Đang mở"</Text> sau khi đăng. Các đội khác có thể nhận kèo của bạn.
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleCreateMatch}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="football-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Đăng kèo ngay</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  heroCard: {
    backgroundColor: '#22c55e',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
  },

  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },

  formCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },

  fieldGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
  },

  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },

  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 5,
  },

  hintText: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 5,
  },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    gap: 8,
  },

  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1d4ed8',
    lineHeight: 18,
  },

  submitBtn: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },

  submitBtnDisabled: {
    backgroundColor: '#86efac',
    elevation: 0,
    shadowOpacity: 0,
  },

  submitBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },

  cancelBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },

  cancelBtnText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
});
