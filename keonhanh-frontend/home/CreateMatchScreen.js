import React, { useState, useContext, useRef } from 'react';
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
  Image,
  Modal,
  FlatList
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../auth/AuthContext';
import { API_BASE_URL } from '../config/api';
import * as Location from 'expo-location';

export default function CreateMatchScreen({ navigation }) {
  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({
    location: '',
    fieldName: '',
    playTime: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [dateObj, setDateObj] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('date');

  const [showMap, setShowMap] = useState(false);
  const [mapCoordinate, setMapCoordinate] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 10.762622,
    longitude: 106.660172,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [mapSearch, setMapSearch] = useState('');

  const handleOpenMap = async () => {
    setShowMap(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Bạn chưa cấp quyền vị trí. Bản đồ sẽ hiển thị mặc định.');
      return;
    }
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (location && location.coords) {
        setMapRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    } catch (e) {
      console.log('Error getting location', e);
    }
  };

  const searchMap = async () => {
    if (!mapSearch.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearch)}`, {
        headers: {
          'User-Agent': 'KeonhanhApp/1.0',
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        selectSearchResult(data[0]);
      } else {
        Alert.alert('Không tìm thấy', 'Không tìm thấy địa điểm trên bản đồ.');
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tìm kiếm.');
    }
  };

  const [searchResults, setSearchResults] = useState([]);
  const searchTimeout = useRef(null);

  const handleSearchChange = (text) => {
    setMapSearch(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&addressdetails=1&limit=5`, {
          headers: {
            'User-Agent': 'KeonhanhApp/1.0',
            'Accept': 'application/json'
          }
        });
        const data = await res.json();
        setSearchResults(data || []);
      } catch (e) {
        console.log(e);
      }
    }, 800);
  };

  const selectSearchResult = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setMapRegion({ latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 });
    setMapCoordinate({ latitude: lat, longitude: lon });
    
    const name = item.display_name.split(',')[0];
    handleChange('fieldName', name);
    
    if (item.address && (item.address.city || item.address.state || item.address.county)) {
       handleChange('location', item.address.city || item.address.state || item.address.county);
    }
    
    setSearchResults([]);
    setMapSearch(name);
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
        headers: {
          'User-Agent': 'KeonhanhApp/1.0',
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (data && data.display_name) {
        const name = data.display_name.split(',')[0];
        handleChange('fieldName', name);
        if (data.address && (data.address.city || data.address.state || data.address.county)) {
           handleChange('location', data.address.city || data.address.state || data.address.county);
        }
      }
    } catch (err) {
      console.log('Reverse geocode error', err);
    }
  };

  const confirmLocation = () => {
    setShowMap(false);
  };

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
          userId: user?.id || user?._id,
          location: form.location.trim(),
          fieldName: form.fieldName.trim(),
          playTime: parseDate(form.playTime).toISOString(),
          latitude: mapCoordinate ? mapCoordinate.latitude : null,
          longitude: mapCoordinate ? mapCoordinate.longitude : null,
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
        behavior={Platform.OS === 'ios' ? 'padding' : "height"}
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
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={styles.label}>
                  <Ionicons name="business" size={14} color="#22c55e" /> Tên sân bóng
                </Text>
                <TouchableOpacity 
                  onPress={handleOpenMap}
                  style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}
                >
                  <Ionicons name="map" size={14} color="#3b82f6" style={{marginRight: 4}} />
                  <Text style={{color: '#3b82f6', fontSize: 13, fontWeight: 'bold'}}>Chọn trên bản đồ</Text>
                </TouchableOpacity>
              </View>
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
              {mapCoordinate && (
                <Text style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>
                  <Ionicons name="checkmark-circle" size={12} /> Đã ghim vị trí bản đồ
                </Text>
              )}
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

      {/* Map Modal */}
      <Modal visible={showMap} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
          <View style={{ flexDirection: 'row', padding: 16, alignItems: 'center', backgroundColor: '#f1f5f9', borderBottomWidth: 1, borderColor: '#e2e8f0' }}>
            <TouchableOpacity onPress={() => setShowMap(false)} style={{ padding: 4 }}>
              <Ionicons name="close" size={28} color="#0f172a" />
            </TouchableOpacity>
            <View style={{ flex: 1, flexDirection: 'row', marginLeft: 12, backgroundColor: 'white', borderRadius: 8, paddingHorizontal: 12, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' }}>
              <Ionicons name="search" size={20} color="#64748b" />
              <TextInput
                style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 16 }}
                placeholder="Tìm kiếm khu vực / tên sân..."
                value={mapSearch}
                onChangeText={handleSearchChange}
                onSubmitEditing={searchMap}
                returnKeyType="search"
              />
            </View>
          </View>
          
          {searchResults.length > 0 && (
            <View style={{ position: 'absolute', top: 65, left: 16, right: 16, backgroundColor: 'white', borderRadius: 8, zIndex: 10, elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 4, maxHeight: 250 }}>
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.place_id.toString()}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => selectSearchResult(item)}
                  >
                    <Ionicons name="location-outline" size={20} color="#64748b" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, color: '#334155', flex: 1 }} numberOfLines={2}>
                      {item.display_name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          <MapView
            style={{ flex: 1 }}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onRegionChangeComplete={setMapRegion}
            onPress={(e) => {
              const coord = e.nativeEvent.coordinate;
              setMapCoordinate(coord);
              reverseGeocode(coord.latitude, coord.longitude);
            }}
          >
            {mapCoordinate && <Marker coordinate={mapCoordinate} title="Sân bóng" />}
          </MapView>

          <View style={{ padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#e2e8f0' }}>
            <Text style={{ textAlign: 'center', marginBottom: 12, color: '#64748b' }}>
              Chạm vào bản đồ để chọn vị trí sân bóng của bạn.
            </Text>
            <TouchableOpacity 
              style={{ backgroundColor: '#22c55e', padding: 16, borderRadius: 12, alignItems: 'center' }}
              onPress={confirmLocation}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Xác nhận vị trí này</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
