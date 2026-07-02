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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../auth/AuthContext';
import { API_BASE_URL } from '../config/api';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const SKILL_LABELS = { Beginner: 'Sơ cấp', Intermediate: 'Trung cấp', Advanced: 'Chuyên nghiệp' };
const SKILL_COLORS = { Beginner: '#22c55e', Intermediate: '#f59e0b', Advanced: '#ef4444' };

export default function CreateTeamScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({
    name: '',
    logo: '',
    location: '',
    skillLevel: 'Beginner',
    isRecruiting: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Vui lòng nhập tên đội';
    if (!form.location.trim()) newErrors.location = 'Vui lòng nhập địa điểm';
    if (!user?.id) newErrors.captain = 'Bạn phải đăng nhập để tạo đội';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTeam = async () => {
    if (!validate()) return;

    let res, data;
    try {
      setLoading(true);
      res = await fetch(`${API_BASE_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          logo: form.logo.trim(),
          captainId: user.id,
          location: form.location.trim(),
          skillLevel: form.skillLevel,
          isRecruiting: form.isRecruiting,
          players: [],
        }),
      });
      data = await res.json();
    } catch {
      Alert.alert('❌ Lỗi kết nối', 'Không thể kết nối đến server. Kiểm tra lại mạng!');
      setLoading(false);
      return;
    }

    setLoading(false);

    if (res.ok && data.success) {
      Alert.alert('🎉 Thành công', 'Tạo đội bóng thành công!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('❌ Lỗi', data.message || 'Không thể tạo đội. Thử lại!');
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
          <Text style={styles.headerTitle}>Tạo đội bóng 🛡️</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Ionicons name="shield" size={38} color="white" />
            </View>
            <Text style={styles.heroTitle}>Thành lập đội bóng</Text>
            <Text style={styles.heroSub}>Tập hợp đồng đội và chinh phục sân cỏ!</Text>
          </View>

          {/* Captain info */}
          <View style={styles.captainCard}>
            <View style={styles.captainAvatar}>
              <Ionicons name="person" size={22} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.captainLabel}>Đội trưởng</Text>
              <Text style={styles.captainName}>{user?.username || 'Chưa đăng nhập'}</Text>
            </View>
            <View style={styles.captainBadge}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.captainBadgeText}>Captain</Text>
            </View>
          </View>

          {errors.captain ? (
            <Text style={[styles.errorText, { marginBottom: 12, textAlign: 'center' }]}>
              {errors.captain}
            </Text>
          ) : null}

          {/* Form */}
          <View style={styles.formCard}>

            {/* Tên đội */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                <Ionicons name="shield-outline" size={14} color="#22c55e" /> Tên đội bóng{' '}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="VD: FC Rồng Vàng"
                placeholderTextColor="#aaa"
                value={form.name}
                onChangeText={v => handleChange('name', v)}
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            {/* Logo URL */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                <Ionicons name="image-outline" size={14} color="#22c55e" /> Logo (URL ảnh){' '}
                <Text style={styles.optional}>tuỳ chọn</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="https://..."
                placeholderTextColor="#aaa"
                value={form.logo}
                onChangeText={v => handleChange('logo', v)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {/* Địa điểm */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                <Ionicons name="location-outline" size={14} color="#22c55e" /> Địa điểm{' '}
                <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.location && styles.inputError]}
                placeholder="VD: Quận 1, TP.HCM"
                placeholderTextColor="#aaa"
                value={form.location}
                onChangeText={v => handleChange('location', v)}
              />
              {errors.location ? <Text style={styles.errorText}>{errors.location}</Text> : null}
            </View>

            {/* Trình độ */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                <Ionicons name="trophy-outline" size={14} color="#22c55e" /> Trình độ
              </Text>
              <View style={styles.skillRow}>
                {SKILL_LEVELS.map(level => {
                  const active = form.skillLevel === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.skillChip,
                        active && { backgroundColor: SKILL_COLORS[level], borderColor: SKILL_COLORS[level] },
                      ]}
                      onPress={() => handleChange('skillLevel', level)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.skillChipText, active && { color: 'white' }]}>
                        {SKILL_LABELS[level]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Đang tuyển */}
            <View style={styles.switchRow}>
              <View style={styles.switchLeft}>
                <Ionicons name="people-outline" size={20} color="#22c55e" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.switchLabel}>Đang tuyển thành viên</Text>
                  <Text style={styles.switchSub}>
                    {form.isRecruiting ? 'Đội đang mở tuyển' : 'Đội đã đủ người'}
                  </Text>
                </View>
              </View>
              <Switch
                value={form.isRecruiting}
                onValueChange={v => handleChange('isRecruiting', v)}
                trackColor={{ false: '#d1d5db', true: '#86efac' }}
                thumbColor={form.isRecruiting ? '#22c55e' : '#9ca3af'}
              />
            </View>

          </View>

          {/* Info box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#3b82f6" />
            <Text style={styles.infoText}>
              Bạn sẽ trở thành <Text style={{ fontWeight: 'bold' }}>đội trưởng</Text>. Thêm cầu thủ sau khi tạo đội thành công.
            </Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleCreateTeam}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="shield" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Thành lập đội ngay</Text>
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
    paddingBottom: 48,
  },

  // Hero
  heroCard: {
    backgroundColor: '#16a34a',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
  },

  // Captain card
  captainCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#dcfce7',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  captainAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  captainLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 2,
  },
  captainName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  captainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef9c3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  captainBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400e',
  },

  // Form card
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

  required: {
    color: '#ef4444',
  },

  optional: {
    color: '#9ca3af',
    fontWeight: '400',
    fontSize: 12,
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

  // Skill chips
  skillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  skillChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  skillChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },

  // Switch row
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  switchSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1d4ed8',
    lineHeight: 18,
  },

  // Buttons
  submitBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#16a34a',
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
