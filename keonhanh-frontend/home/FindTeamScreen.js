import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../auth/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function FindTeamScreen({ navigation }) {
  const { user, isLoggedIn } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myProfileId, setMyProfileId] = useState(null);
  const [myTeamId, setMyTeamId] = useState(null);
  // Map teamId -> trạng thái request: 'none' | 'pending' | 'sending'
  const [requestStatus, setRequestStatus] = useState({});

  // Nếu chưa đăng nhập → không cho vào
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#22c55e" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tìm đội bóng</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.lockedBox}>
          <Ionicons name="lock-closed" size={72} color="#cbd5e1" />
          <Text style={styles.lockedTitle}>Cần đăng nhập</Text>
          <Text style={styles.lockedSub}>
            Bạn cần đăng nhập để có thể tìm và xin gia nhập đội bóng.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => navigation.navigate('login')}
          >
            <Ionicons name="log-in-outline" size={20} color="white" style={{ marginRight: 8 }} />
            <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fetchData = async () => {
    try {
      // 1. Lấy profile của user đang đăng nhập
      const profileRes = await fetch(`${API_BASE_URL}/api/user-profiles/${user.id}`);
      const profileData = await profileRes.json();

      let profileId = null;
      if (profileRes.ok && profileData.profile) {
        profileId = profileData.profile._id;
        setMyProfileId(profileId);
      }

      // 2. Kiểm tra user đã có đội chưa
      if (profileId) {
        const myTeamRes = await fetch(`${API_BASE_URL}/api/teams/my-team/${profileId}`);
        const myTeamData = await myTeamRes.json();
        if (myTeamRes.ok && myTeamData.success) {
          setMyTeamId(myTeamData.data._id);
        } else {
          setMyTeamId(null);
        }
      }

      // 3. Lấy tất cả đội
      const teamsRes = await fetch(`${API_BASE_URL}/api/teams`);
      const teamsData = await teamsRes.json();
      if (teamsRes.ok && teamsData.success) {
        setTeams(teamsData.data);
      }
    } catch (err) {
      console.log('FindTeam fetch error:', err);
      Alert.alert('Lỗi', 'Không thể kết nối tới server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleJoinRequest = async (team) => {
    if (!myProfileId) {
      Alert.alert('Chưa có hồ sơ', 'Bạn cần tạo hồ sơ cá nhân trước khi xin vào đội.');
      return;
    }

    if (myTeamId) {
      Alert.alert('Đã có đội', 'Bạn đã thuộc một đội rồi. Hãy rời đội trước khi xin vào đội mới.');
      return;
    }

    // Đánh dấu đang gửi
    setRequestStatus(prev => ({ ...prev, [team._id]: 'sending' }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/join-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: myProfileId, teamId: team._id }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setRequestStatus(prev => ({ ...prev, [team._id]: 'pending' }));
        Alert.alert('✅ Đã gửi!', data.message);
      } else {
        setRequestStatus(prev => ({ ...prev, [team._id]: 'none' }));
        Alert.alert('Không thể gửi', data.message);
      }
    } catch (err) {
      setRequestStatus(prev => ({ ...prev, [team._id]: 'none' }));
      Alert.alert('Lỗi', 'Không thể kết nối tới server.');
    }
  };

  const renderTeamCard = ({ item }) => {
    const status = requestStatus[item._id] || 'none';
    const isMyCaptain = item.captainId?._id === user.id || item.captainId === user.id;
    const isMember = myTeamId && item._id === myTeamId;

    let btnContent;
    if (isMember) {
      btnContent = (
        <View style={[styles.joinBtn, styles.joinBtnMember]}>
          <Ionicons name="checkmark-circle" size={16} color="#16a34a" style={{ marginRight: 6 }} />
          <Text style={[styles.joinBtnText, { color: '#16a34a' }]}>Đội của bạn</Text>
        </View>
      );
    } else if (isMyCaptain) {
      btnContent = (
        <View style={[styles.joinBtn, styles.joinBtnCaptain]}>
          <Ionicons name="shield-checkmark" size={16} color="#f59e0b" style={{ marginRight: 6 }} />
          <Text style={[styles.joinBtnText, { color: '#f59e0b' }]}>Bạn là đội trưởng</Text>
        </View>
      );
    } else if (status === 'sending') {
      btnContent = (
        <View style={[styles.joinBtn, styles.joinBtnPending]}>
          <ActivityIndicator size="small" color="#64748b" />
          <Text style={[styles.joinBtnText, { color: '#64748b', marginLeft: 8 }]}>Đang gửi...</Text>
        </View>
      );
    } else if (status === 'pending') {
      btnContent = (
        <View style={[styles.joinBtn, styles.joinBtnPending]}>
          <Ionicons name="time-outline" size={16} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={[styles.joinBtnText, { color: '#64748b' }]}>Đang chờ duyệt</Text>
        </View>
      );
    } else {
      btnContent = (
        <TouchableOpacity
          style={[styles.joinBtn, styles.joinBtnActive]}
          onPress={() => handleJoinRequest(item)}
          activeOpacity={0.8}
        >
          <Ionicons name="enter-outline" size={16} color="white" style={{ marginRight: 6 }} />
          <Text style={[styles.joinBtnText, { color: 'white' }]}>Xin vào đội</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.card}>
        {/* Header đội */}
        <View style={styles.cardHeader}>
          <View style={styles.logoWrap}>
            {item.logo && item.logo.startsWith('data:image') ? (
              <Image source={{ uri: item.logo }} style={styles.logo} resizeMode="cover" />
            ) : (
              <Ionicons name="shield" size={32} color="#22c55e" />
            )}
          </View>
          <View style={styles.cardTitleWrap}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Ionicons name="trophy" size={11} color="#f59e0b" />
                <Text style={styles.badgeText}>{item.skillLevel}</Text>
              </View>
              <View style={[styles.badge, item.isRecruiting ? styles.badgeOpen : styles.badgeClosed]}>
                <Text style={[styles.badgeText, item.isRecruiting ? styles.badgeTextOpen : styles.badgeTextClosed]}>
                  {item.isRecruiting ? 'Đang tuyển' : 'Đủ người'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Thông tin đội */}
        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#64748b" />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={14} color="#64748b" />
            <Text style={styles.infoText}>{item.players?.length || 0} thành viên</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-circle-outline" size={14} color="#64748b" />
            <Text style={styles.infoText}>Đội trưởng: {item.captainId?.username || 'Ẩn danh'}</Text>
          </View>
        </View>

        {/* Nút hành động */}
        {btnContent}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#22c55e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tìm đội bóng</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Đang tải danh sách đội...</Text>
        </View>
      ) : teams.length === 0 ? (
        <View style={styles.centerBox}>
          <Ionicons name="shield-half-outline" size={72} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Chưa có đội bóng nào</Text>
          <Text style={styles.emptySub}>Hãy tạo đội đầu tiên!</Text>
        </View>
      ) : (
        <FlatList
          data={teams}
          keyExtractor={(item) => item._id}
          renderItem={renderTeamCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },

  // Header
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
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },

  // Locked (chưa đăng nhập)
  lockedBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, paddingBottom: 60,
  },
  lockedTitle: {
    fontSize: 22, fontWeight: 'bold', color: '#334155',
    marginTop: 20, marginBottom: 10,
  },
  lockedSub: {
    fontSize: 15, color: '#64748b', textAlign: 'center',
    lineHeight: 22, marginBottom: 28,
  },
  loginBtn: {
    flexDirection: 'row', backgroundColor: '#22c55e',
    paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, alignItems: 'center',
    elevation: 2,
  },
  loginBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // List
  listContent: { padding: 16, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: 'white', borderRadius: 20,
    padding: 16, marginBottom: 16, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  logoWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#dcfce7', justifyContent: 'center',
    alignItems: 'center', marginRight: 14, overflow: 'hidden',
  },
  logo: { width: '100%', height: '100%' },
  cardTitleWrap: { flex: 1 },
  cardName: { fontSize: 17, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fef3c7', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 6, gap: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#92400e' },
  badgeOpen: { backgroundColor: '#dcfce7' },
  badgeTextOpen: { color: '#166534' },
  badgeClosed: { backgroundColor: '#f1f5f9' },
  badgeTextClosed: { color: '#64748b' },

  cardInfo: {
    backgroundColor: '#f8fafc', borderRadius: 12,
    padding: 10, marginBottom: 14, gap: 6,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, color: '#475569' },

  // Buttons
  joinBtn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 12,
    borderRadius: 12,
  },
  joinBtnActive: { backgroundColor: '#22c55e', elevation: 1 },
  joinBtnPending: { backgroundColor: '#f1f5f9' },
  joinBtnMember: { backgroundColor: '#dcfce7' },
  joinBtnCaptain: { backgroundColor: '#fef3c7' },
  joinBtnText: { fontWeight: 'bold', fontSize: 14 },

  // Loading / Empty
  loadingText: { marginTop: 12, fontSize: 15, color: '#64748b' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#334155', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
