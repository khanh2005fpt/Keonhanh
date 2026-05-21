import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';

export default function HomeScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/players`);
      const data = await response.json();

      console.log("API DATA:", data);

      const players = data.players || [];

      if (error) return <Text>{error}</Text>;

      const formatted = players.map((p, i) => ({
        id: p._id || i,
        team: p.team || 'Chưa xác định',
        field: p.field || 'Sân không xác định',
        time: p.time || 'Không có giờ',
        status: p.status || 'Chờ xác nhận',
      }));

      setMatches(formatted);
    } catch (err) {
      console.log("ERROR:", err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Xin chào 👋</Text>
            <Text style={styles.title}>Tìm kèo đá bóng</Text>
          </View>

          <TouchableOpacity style={styles.avatar}>
            <Ionicons name="person" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Đặt kèo cực nhanh ⚽</Text>

          <Text style={styles.bannerText}>
            Tìm đội - tìm người - ghép kèo chỉ trong vài phút
          </Text>

          <TouchableOpacity style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>Tạo kèo ngay</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Chức năng</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="people" size={45} color="#22c55e" />
            <Text style={styles.actionText}>Tìm đối</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Cầu thủ')}
          >
            <Ionicons name="person-add" size={45} color="#3b82f6" />
            <Text style={styles.actionText}>Tìm người</Text>
          </TouchableOpacity>

        </View>

        {/* Match List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kèo nổi bật 🔥</Text>
          {!loading && (
            <TouchableOpacity onPress={fetchMatches}>
              <Ionicons name="refresh" size={24} color="#22c55e" />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={styles.errorText}>Lỗi: {error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchMatches}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="inbox-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>Không có kèo nào</Text>
          </View>
        ) : (
          matches.map((item) => (
            <View key={item.id} style={styles.matchCard}>
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

              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Tham gia kèo</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    paddingHorizontal: 16,
    paddingTop: 50,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  hello: {
    fontSize: 16,
    color: '#666',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },

  banner: {
    backgroundColor: '#22c55e',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },

  bannerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  bannerText: {
    color: 'white',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },

  bannerButton: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },

  bannerButtonText: {
    color: '#22c55e',
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  actionCard: {
    width: '45%',
    backgroundColor: 'white',
    borderRadius: 18,
    paddingVertical: 22,
    alignItems: 'center',
  },

  actionText: {
    marginTop: 10,
    fontWeight: '600',
  },

  matchCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },

  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  teamName: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  badge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },

  badgeText: {
    color: '#16a34a',
    fontWeight: 'bold',
    fontSize: 12,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  infoText: {
    marginLeft: 8,
    color: '#555',
  },

  joinButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },

  joinButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  errorContainer: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },

  errorText: {
    color: '#dc2626',
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },

  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },

  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
});