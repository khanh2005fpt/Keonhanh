import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { getTeams, deleteTeam } from '../api/teamApi';

export default function TeamListScreen({ navigation }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  // GET DATA
  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await getTeams();
      setTeams(res.data || []);
    } catch (error) {
      console.log('FETCH ERROR:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // AUTO REFRESH WHEN SCREEN FOCUS
  useFocusEffect(
    useCallback(() => {
      fetchTeams();
    }, [])
  );

  // DELETE TEAM
  const handleDelete = (id) => {
    console.log('DELETE ID:', id);
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTeam(id);
            fetchTeams();
          } catch (error) {
            console.log('DELETE ERROR:', error.message);
          }
        },
      },
    ]);
  };

  // LOADING UI
  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={teams}
        keyExtractor={(item) => String(item.id || item._id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('Chi tiết đội', {
                team: item,
              })
            }
          >
            <Text style={styles.teamName}>{item.name}</Text>
            <Text style={styles.location}>{item.location}</Text>

            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                  navigation.navigate('Tạo đội', { team: item })
                }
              >
                <Text style={styles.actionText}>Sửa</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id || item._id)}
              >
                <Text style={styles.actionText}>Xóa</Text>
              </TouchableOpacity>
            </View>
            
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>Chưa có đội nào</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Tạo đội')}
      >
        <Text style={styles.buttonText}>+ Tạo đội</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f3f3f3',
  },

  card: {
    backgroundColor: '#fff',

    borderRadius: 28,

    paddingHorizontal: 28,
    paddingVertical: 30,

    marginBottom: 18,

    shadowColor: '#39a935',

    shadowOffset: {
      width: 0,
      height: 8,
    },

    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 4,
  },

  teamName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',

    marginBottom: 14,
  },

  location: {
    fontSize: 18,
    color: '#444',
  },

  button: {
    backgroundColor: '#39a935',

    borderRadius: 22,

    paddingVertical: 22,

    alignItems: 'center',

    shadowColor: '#39a935',

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.1,
    shadowRadius: 10,

    elevation: 4,
  },

  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  actionContainer: {
  flexDirection: 'row',
  marginTop: 20,
  gap: 12,
  },

  editButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  deleteButton: {
    flex: 1,
    backgroundColor: '#E53935',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

});