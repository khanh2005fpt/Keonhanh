import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../config/api';

export default function AllMatchesScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchOpenMatches();
    }, [])
  );

  const fetchOpenMatches = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/matches`);
      const result = await response.json();

      if (response.ok && result.success) {
        const matchesData = result.data || [];
        // Only keep "open" matches
        const openMatches = matchesData.filter(m => m.status === 'open');
        
        const formatted = openMatches.map((m) => {
          const date = new Date(m.playTime);
          const hours = date.getHours();
          const minutes = date.getMinutes();
          const hStr = hours.toString().padStart(2, '0');
          const mStr = minutes.toString().padStart(2, '0');

          let timeStr;
          if (hours === 0 && minutes === 0) {
            timeStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
          } else {
            timeStr = `${hStr}:${mStr} - ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
          }

          return {
            id: m._id,
            team: m.creatorTeamId ? m.creatorTeamId.name : 'Đội ẩn danh',
            field: m.fieldName || 'Sân chưa xác định',
            time: timeStr,
            status: 'Đang tìm đối',
            createdAt: new Date(m.createdAt || Date.now()).getTime(), // For sorting if needed
          };
        });

        // Newest first
        formatted.reverse();
        setMatches(formatted);
      } else {
        setMatches([]);
      }
    } catch (err) {
      console.log("ERROR fetching open matches:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => navigation.navigate('matchDetail', { matchId: item.id })}
    >
      <View style={styles.matchHeader}>
        <Text style={styles.teamName}>{item.team}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={18} color="#666" />
        <Text style={styles.infoText}>{item.field}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={18} color="#666" />
        <Text style={styles.infoText}>{item.time}</Text>
      </View>

      <View style={styles.joinButton}>
        <Text style={styles.joinButtonText}>Xem / Tham gia kèo</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#22c55e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kèo đang tìm đối ⚽</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="football-outline" size={48} color="#999" />
          <Text style={styles.emptyText}>Chưa có kèo nào đang mở</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#16a34a',
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  joinButton: {
    marginTop: 12,
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
