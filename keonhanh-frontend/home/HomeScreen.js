import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../auth/AuthContext';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';

export default function HomeScreen({ navigation }) {
  const { user, isLoggedIn } = useContext(AuthContext);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [])
  );

  const fetchMatches = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/matches`);
      const result = await response.json();

      if (response.ok && result.success) {
        const matchesData = result.data || [];
        const formatted = matchesData.map((m) => {
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

          let statusVN = m.status;
          if (m.status === 'open') statusVN = 'Đang tìm đối';
          else if (m.status === 'matched') statusVN = 'Đã chốt kèo';
          else if (m.status === 'finished') statusVN = 'Đã kết thúc';
          else if (m.status === 'cancelled') statusVN = 'Đã hủy';

          return {
            id: m._id,
            team: m.creatorTeamId ? m.creatorTeamId.name : 'Đội ẩn danh',
            field: m.fieldName || 'Sân chưa xác định',
            time: timeStr,
            status: statusVN,
          };
        });

        // Sort matches by newest first
        formatted.reverse();
        setMatches(formatted);

      } else {
        setMatches([]);
      }
    } catch (err) {
      console.log("ERROR fetching matches:", err);
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
            <Text style={styles.hello}>Xin chào {isLoggedIn ? user?.username : ""} 👋</Text>
          </View>
          {isLoggedIn ? (
            <TouchableOpacity
              style={styles.avatar}
              onPress={() => navigation.navigate('profile', { userId: user?._id || user?.id, username: user?.username })}
            >
              <Ionicons name="person" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <View style={styles.authButtons}>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => navigation.navigate('login')}
              >
                <Text style={styles.loginBtnText}>Đăng nhập</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.registerBtn}
                onPress={() => navigation.navigate('register')}
              >
                <Text style={styles.registerBtnText}>Đăng ký</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Đặt kèo cực nhanh ⚽</Text>

          <Text style={styles.bannerText}>
            Tìm đội - tìm người - ghép kèo chỉ trong vài phút
          </Text>

          <TouchableOpacity
            style={styles.bannerButton}
            onPress={() => navigation.navigate('createMatch')}
          >
            <Text style={styles.bannerButtonText}>Tạo kèo ngay</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Tính năng</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              if (!isLoggedIn) {
                Alert.alert(
                  '🔒 Cần đăng nhập',
                  'Bạn cần đăng nhập để tìm và xin gia nhập đội bóng.',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    { text: 'Đăng nhập', onPress: () => navigation.navigate('login') },
                  ]
                );
                return;
              }
              navigation.navigate('findTeam');
            }}
          >
            <Ionicons name="people" size={40} color="#22c55e" />
            <Text style={styles.actionText}>Tìm đội</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Cầu thủ')}
          >
            <Ionicons name="person-add" size={40} color="#3b82f6" />
            <Text style={styles.actionText}>Tìm người</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('createTeam')}
          >
            <Ionicons name="shield" size={40} color="#f59e0b" />
            <Text style={styles.actionText}>Tạo đội</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('createMatch')}
          >
            <Ionicons name="football" size={40} color="#ef4444" />
            <Text style={styles.actionText}>Tạo kèo</Text>
          </TouchableOpacity>
        </View>

        {/* Match List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Kèo nổi bật 🔥</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => navigation.navigate('allMatches')}>
              <Text style={{ color: '#22c55e', fontWeight: '600', marginRight: 16 }}>Xem tất cả</Text>
            </TouchableOpacity>
            {!loading && (
              <TouchableOpacity onPress={fetchMatches}>
                <Ionicons name="refresh" size={24} color="#22c55e" />
              </TouchableOpacity>
            )}
          </View>
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
            <Ionicons name="football-outline" size={48} color="#999" />
            <Text style={styles.emptyText}>Không có kèo nào</Text>
          </View>
        ) : (
          matches.slice(0, 5).map((item) => (
            <TouchableOpacity
              key={item.id}
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
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4fdf4',
    paddingHorizontal: 20,
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
    color: '#166534',
    fontWeight: '600',
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#14532d',
    marginTop: 4,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    borderWidth: 2,
    borderColor: '#dcfce7',
  },

  banner: {
    backgroundColor: '#16a34a',
    borderRadius: 24,
    padding: 24,
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  bannerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 10,
  },

  bannerText: {
    color: '#dcfce7',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: '500',
  },

  bannerButton: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },

  bannerButtonText: {
    color: '#16a34a',
    fontWeight: '800',
    fontSize: 15,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#14532d',
    marginBottom: 16,
  },

  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },

  actionCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },

  actionText: {
    marginTop: 12,
    fontWeight: '800',
    color: '#14532d',
    fontSize: 15,
  },

  matchCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },

  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  teamName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#14532d',
    flex: 1,
  },

  badge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 10,
  },

  badgeText: {
    color: '#16a34a',
    fontWeight: '800',
    fontSize: 12,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  infoText: {
    marginLeft: 10,
    color: '#166534',
    fontWeight: '600',
    fontSize: 14,
  },

  joinButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    elevation: 3,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },

  joinButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
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
    paddingVertical: 60,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '700',
  },

  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },

  errorText: {
    color: '#dc2626',
    marginTop: 12,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '600',
  },

  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    elevation: 2,
  },

  retryButtonText: {
    color: 'white',
    fontWeight: '800',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: 'white',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },

  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '700',
  },

  authButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  loginBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },

  loginBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
  },

  registerBtn: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4ade80',
  },

  registerBtnText: {
    color: '#16a34a',
    fontWeight: '800',
    fontSize: 14,
  },
});