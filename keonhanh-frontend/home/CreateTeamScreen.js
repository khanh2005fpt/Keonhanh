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
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

const SKILL_LEVELS = ['Sơ cấp', 'Trung cấp', 'Chuyên nghiệp'];
const SKILL_LABELS = { 'Sơ cấp': 'Sơ cấp', 'Trung cấp': 'Trung cấp', 'Chuyên nghiệp': 'Chuyên nghiệp' };
const SKILL_COLORS = { 'Sơ cấp': '#22c55e', 'Trung cấp': '#f59e0b', 'Chuyên nghiệp': '#ef4444' };

export default function CreateTeamScreen({ navigation }) {
  const { user, updateUser } = useContext(AuthContext);

  const [form, setForm] = useState({
    name: '',
    logo: '',
    location: '',
    skillLevel: 'Sơ cấp',
    isRecruiting: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Cần quyền truy cập', 'Vui lòng cho phép truy cập thư viện ảnh trong cài đặt.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8, // Ảnh gốc có thể lấy chất lượng cao
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      // ÉP KÍCH THƯỚC: Resize ảnh xuống chỉ còn 300x300 pixel và nén lại
      // Việc này giúp chuỗi Base64 chỉ còn khoảng 10KB-20KB, DB không bao giờ bị đơ
      const manipResult = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 300, height: 300 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const base64Uri = `data:image/jpeg;base64,${manipResult.base64}`;
      setForm(prev => ({ ...prev, logo: base64Uri, logoUri: manipResult.uri }));
    }
  };

  const removeLogo = () => {
    setForm(prev => ({ ...prev, logo: '', logoUri: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Vui lòng nhập tên đội';
    if (!form.location.trim()) newErrors.location = 'Vui lòng nhập địa điểm';
    if (!user || !user._id) {
      newErrors.captain = "Bạn phải đăng nhập để tạo đội";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleCreateTeam = async () => {
  if (!validate()) return;

  setLoading(true);

  try {
    // Hỗ trợ cả id và _id
    const captainId = user?._id;

    // console.log("USER:", user);

    // console.log("REQUEST BODY:", {
    //   name: form.name.trim(),
    //   logo: form.logo,
    //   captainId,
    //   location: form.location.trim(),
    //   skillLevel: form.skillLevel,
    //   isRecruiting: form.isRecruiting,
    //   players: [],
    // });

    const res = await fetch(`${API_BASE_URL}/api/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.name.trim(),
        logo: form.logo,
        captainId,
        location: form.location.trim(),
        skillLevel: form.skillLevel,
        isRecruiting: form.isRecruiting,
        players: [],
      }),
    });

    const data = await res.json();

    // console.log("STATUS:", res.status);
    // console.log("RESPONSE:", data);

    if (!res.ok) {
      Alert.alert("Lỗi", data.message || "Không thể tạo đội.");
      return;
    }

    if (data.success) {
      // Cập nhật teamId vào AuthContext để các màn hình khác biết user đã có đội
      const newTeamId = data.data?._id;
      if (newTeamId) {
        await updateUser({ teamId: newTeamId });
      }

      Alert.alert("Thành công", "Tạo đội thành công!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      Alert.alert("Lỗi", data.message);
    }
  } catch (err) {
    //console.log("CREATE TEAM ERROR:", err);

    Alert.alert(
      "Lỗi kết nối",
      "Không thể kết nối tới server."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={22} color="#16a34a" />
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
              <Text style={styles.hello}>Gia Nhập Làng Bóng 🌟</Text>
              <Text style={styles.headerTitle}>Tạo Đội Mới</Text>
            </View>
          </View>
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

            {/* Logo */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                <Ionicons name="image-outline" size={14} color="#22c55e" /> Logo đội bóng{' '}
                <Text style={styles.optional}>tuỳ chọn</Text>
              </Text>

              {form.logoUri ? (
                <View style={styles.logoPreviewWrap}>
                  <Image
                    source={{ uri: form.logoUri }}
                    style={styles.logoPreview}
                    resizeMode="cover"
                  />
                  <View style={styles.logoActions}>
                    <TouchableOpacity style={styles.logoChangeBtn} onPress={pickLogo}>
                      <Ionicons name="camera-outline" size={16} color="#22c55e" />
                      <Text style={styles.logoChangeBtnText}>Thay ảnh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoRemoveBtn} onPress={removeLogo}>
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      <Text style={styles.logoRemoveBtnText}>Xóa</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.logoPickerBtn} onPress={pickLogo} activeOpacity={0.8}>
                  <View style={styles.logoPickerIcon}>
                    <Ionicons name="camera" size={28} color="#22c55e" />
                  </View>
                  <Text style={styles.logoPickerText}>Chọn ảnh từ thư viện</Text>
                  <Text style={styles.logoPickerSub}>Tỷ lệ 1:1 — JPEG / PNG</Text>
                </TouchableOpacity>
              )}
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
  container: { flex: 1, backgroundColor: '#f4fdf4' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: '#16a34a',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 8,
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 2, marginRight: 12 },
  headerTextWrap: { justifyContent: 'center' },
  hello: { fontSize: 13, color: '#dcfce7', fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: 'white' },

  scrollContent: { padding: 16, paddingTop: 24, paddingBottom: 48 },

  // Hero
  heroCard: {
    backgroundColor: '#16a34a',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
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

  // Logo picker
  logoPickerBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#86efac',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  logoPickerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoPickerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16a34a',
  },
  logoPickerSub: {
    fontSize: 12,
    color: '#86efac',
  },

  logoPreviewWrap: {
    alignItems: 'center',
    gap: 12,
  },
  logoPreview: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#22c55e',
  },
  logoActions: {
    flexDirection: 'row',
    gap: 10,
  },
  logoChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoChangeBtnText: {
    color: '#16a34a',
    fontWeight: '600',
    fontSize: 14,
  },
  logoRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoRemoveBtnText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
});
