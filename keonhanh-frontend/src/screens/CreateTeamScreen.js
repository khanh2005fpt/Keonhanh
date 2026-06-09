import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';

import { createTeam, updateTeam } from '../api/teamApi';

export default function CreateTeamScreen({ navigation, route }) {
  const editingTeam = route.params?.team;
  const [name, setName] = useState(editingTeam?.name || '');
  const [location, setLocation] = useState(editingTeam?.location || '');

  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên đội không được để trống');
      return false;
    }

    if (name.trim().length < 3) {
      Alert.alert('Lỗi', 'Tên đội phải ít nhất 3 ký tự');
      return false;
    }

    if (!location.trim()) {
      Alert.alert('Lỗi', 'Khu vực không được để trống');
      return false;
    }

    if (location.trim().length < 2) {
      Alert.alert('Lỗi', 'Khu vực quá ngắn');
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;

    try {
      setLoading(true);

      const payload = {
        name: name.trim(),
        location: location.trim(),
      };

      if (editingTeam) {
        await updateTeam(editingTeam._id, payload);

        Alert.alert('Thành công', 'Cập nhật đội thành công');
      } else {
        await createTeam(payload);

        Alert.alert('Thành công', 'Tạo đội thành công');
      }

      navigation.goBack();
    } catch (error) {
      console.log('SAVE ERROR:', error.message);

      Alert.alert('Lỗi', 'Không lưu được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Tên đội"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        style={styles.input}
      />

      <TextInput
        placeholder="Khu vực"
        value={location}
        onChangeText={setLocation}
        autoCapitalize="words"
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleCreate}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading
            ? 'Đang xử lý...'
            : editingTeam
            ? 'Cập nhật đội'
            : 'Tạo đội'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },

  button: {
    backgroundColor: '#389c35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
