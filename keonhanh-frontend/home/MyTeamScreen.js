import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';
import { AuthContext } from '../auth/AuthContext';

export default function MyTeamScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myProfileId, setMyProfileId] = useState(null);
  // Danh sách yêu cầu gia nhập (chỉ đội trưởng thấy)
  const [joinRequests, setJoinRequests] = useState([]);
  const [processingId, setProcessingId] = useState(null); // request đang xử lý
  const [kickingId, setKickingId] = useState(null); // player đang bị kick
  const [togglingRecruiting, setTogglingRecruiting] = useState(false); // đang toggle trạng thái tuyển quân

  const fetchMyTeam = async () => {
    if (!user?.id) return;
    try {
      // 1. Lấy profileId của tài khoản đang đăng nhập
      const profileRes = await fetch(`${API_BASE_URL}/api/user-profiles/${user.id}`);
      const profileData = await profileRes.json();

      if (!profileRes.ok || !profileData.profile) {
        setTeam(null);
        setLoading(false);
        setRefreshing(false);
        Alert.alert('Lỗi Profile', profileData.message || 'Chưa thể lấy thông tin cá nhân.');
        return;
      }

      const profileId = profileData.profile._id;
      setMyProfileId(profileId);

      // 2. Lấy đội bóng theo đúng profileId
      const res = await fetch(`${API_BASE_URL}/api/teams/my-team/${profileId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTeam(data.data);

        // 3. Nếu user là đội trưởng → lấy danh sách yêu cầu gia nhập
        const isCaptain =
          data.data.captainId?._id === user.id ||
          data.data.captainId === user.id;

        if (isCaptain) {
          await fetchJoinRequests();
        }
      } else {
        setTeam(null);
      }
    } catch (error) {
      console.log('Lỗi fetch team:', error);
      Alert.alert('Lỗi', 'Không thể kết nối tới server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchJoinRequests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/join-requests/captain/${user.id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setJoinRequests(data.data);
      } else {
        setJoinRequests([]);
      }
    } catch (err) {
      console.log('Lỗi fetch join requests:', err);
    }
  };

  useEffect(() => {
    fetchMyTeam();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyTeam();
  };

  // Đội trưởng phê duyệt
  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/join-requests/${requestId}/approve`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Alert.alert('✅ Đã phê duyệt', data.message);
        // Làm mới toàn bộ
        setLoading(true);
        fetchMyTeam();
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể kết nối tới server.');
    } finally {
      setProcessingId(null);
    }
  };

  // Đội trưởng từ chối
  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/join-requests/${requestId}/reject`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setJoinRequests(prev => prev.filter(r => r._id !== requestId));
        Alert.alert('Đã từ chối', data.message);
      } else {
        Alert.alert('Lỗi', data.message);
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể kết nối tới server.');
    } finally {
      setProcessingId(null);
    }
  };

  // Đội trưởng bật/tắt tuyển quân
  const handleToggleRecruiting = async () => {
    if (!team) return;
    const action = team.isRecruiting ? 'dừng tuyển' : 'mở tuyển lại';
    Alert.alert(
      team.isRecruiting ? '🔒 Dừng tuyển quân?' : '🟢 Mở tuyển lại?',
      team.isRecruiting
        ? `Khi dừng tuyển, không ai có thể gửi yêu cầu gia nhập đội nữa. Bạn vẫn có thể mở lại sau.`
        : `Mở tuyển quân sẽ cho phép người khác gửi yêu cầu gia nhập đội.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: team.isRecruiting ? 'Dừng tuyển' : 'Mở tuyển',
          style: team.isRecruiting ? 'destructive' : 'default',
          onPress: async () => {
            setTogglingRecruiting(true);
            try {
              const res = await fetch(`${API_BASE_URL}/api/teams/${team._id}/toggle-recruiting`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ captainUserId: user.id }),
              });
              const data = await res.json();
              if (res.ok && data.success) {
                Alert.alert(data.isRecruiting ? '✅ Đã mở tuyển' : '🔒 Đã dừng tuyển', data.message);
                setLoading(true);
                fetchMyTeam();
              } else {
                Alert.alert('Lỗi', data.message);
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể kết nối tới server.');
            } finally {
              setTogglingRecruiting(false);
            }
          },
        },
      ]
    );
  };

  // Đội trưởng kick thành viên
  const handleKick = (playerId, playerName) => {
    Alert.alert(
      'Xác nhận kick',
      `Bạn có chắc muốn kick "${playerName}" khỏi đội không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Kick',
          style: 'destructive',
          onPress: async () => {
            setKickingId(playerId);
            try {
              const res = await fetch(`${API_BASE_URL}/api/teams/${team._id}/kick/${playerId}`, {
                method: 'PATCH',
              });
              const data = await res.json();
              if (res.ok && data.success) {
                Alert.alert('✅ Đã kick', data.message);
                setLoading(true);
                fetchMyTeam();
              } else {
                Alert.alert('Lỗi', data.message);
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể kết nối tới server.');
            } finally {
              setKickingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  const isCaptain =
    team &&
    (team.captainId?._id === user?.id || team.captainId === user?.id);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#22c55e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đội bóng của tôi</Text>
        {/* Badge yêu cầu gia nhập */}
        {isCaptain && joinRequests.length > 0 ? (
          <View style={styles.badgeWrap}>
            <Ionicons name="notifications" size={22} color="#ef4444" />
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{joinRequests.length}</Text>
            </View>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {!team ? (
          <View style={styles.emptyBox}>
            <Ionicons name="shield-half-outline" size={80} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Bạn chưa có đội bóng</Text>
            <Text style={styles.emptySub}>Hãy tạo một đội mới hoặc xin gia nhập vào một đội khác nhé!</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('createTeam')}
            >
              <Ionicons name="add-circle" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.createBtnText}>Tạo đội ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Team Info */}
            <View style={styles.teamCard}>
              <View style={styles.teamHeader}>
                <View style={styles.logoWrap}>
                  {team.logo && team.logo.startsWith('data:image') ? (
                    <Image source={{ uri: team.logo }} style={styles.logo} resizeMode="cover" />
                  ) : (
                    <Ionicons name="shield" size={40} color="#22c55e" />
                  )}
                </View>
                <View style={styles.teamTitleInfo}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                      <Ionicons name="trophy" size={12} color="#f59e0b" />
                      <Text style={styles.badgeText}>{team.skillLevel}</Text>
                    </View>
                    <View style={[styles.badge, team.isRecruiting ? styles.badgeOpen : styles.badgeClosed]}>
                      <Text style={[styles.badgeText, team.isRecruiting ? styles.badgeTextOpen : styles.badgeTextClosed]}>
                        {team.isRecruiting ? 'Đang tuyển' : 'Đủ người'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.teamDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="location" size={16} color="#64748b" />
                  <Text style={styles.detailText}>{team.location}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="star" size={16} color="#64748b" />
                  <Text style={styles.detailText}>Đội trưởng: {team.captainId?.username}</Text>
                </View>
              </View>
            </View>

            {/* ========== SECTION: YÊU CẦU GIA NHẬP (chỉ đội trưởng) ========== */}
            {isCaptain && (
              <View style={styles.requestsSection}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="notifications-outline" size={20} color="#ef4444" />
                  <Text style={styles.sectionTitle}>
                    Yêu cầu gia nhập
                    {joinRequests.length > 0 && (
                      <Text style={{ color: '#ef4444' }}> ({joinRequests.length})</Text>
                    )}
                  </Text>
                </View>

                {joinRequests.length === 0 ? (
                  <View style={styles.emptyRequestsBox}>
                    <Text style={styles.emptyRequestsText}>Không có yêu cầu nào đang chờ.</Text>
                  </View>
                ) : (
                  joinRequests.map((req) => {
                    const p = req.requesterId;
                    const isProcessing = processingId === req._id;
                    return (
                      <View key={req._id} style={styles.requestCard}>
                        <View style={styles.reqPlayerInfo}>
                          <View style={styles.reqAvatar}>
                            <Ionicons name="person" size={20} color="white" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.reqName}>{p?.fullName || 'Ẩn danh'}</Text>
                            <Text style={styles.reqSub}>
                              {p?.position} • {p?.location}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.reqActions}>
                          <TouchableOpacity
                            style={[styles.reqBtn, styles.approveBtn, isProcessing && { opacity: 0.6 }]}
                            onPress={() => handleApprove(req._id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <>
                                <Ionicons name="checkmark" size={16} color="white" />
                                <Text style={styles.reqBtnText}>Phê duyệt</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.reqBtn, styles.rejectBtn, isProcessing && { opacity: 0.6 }]}
                            onPress={() => handleReject(req._id)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <>
                                <Ionicons name="close" size={16} color="white" />
                                <Text style={styles.reqBtnText}>Từ chối</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* ========== SECTION: TOGGLE TUYỂN QUÂN (chỉ đội trưởng) ========== */}
            {isCaptain && (
              <View style={styles.recruitingSection}>
                <View style={styles.recruitingInfo}>
                  <Ionicons
                    name={team.isRecruiting ? 'people' : 'lock-closed'}
                    size={20}
                    color={team.isRecruiting ? '#22c55e' : '#ef4444'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recruitingTitle}>
                      {team.isRecruiting ? 'Đang tuyển thành viên' : 'Đã đóng tuyển'}
                    </Text>
                    <Text style={styles.recruitingSubText}>
                      {team.players.length}/14 thành viên
                      {team.players.length >= 14
                        ? ' — Đội đã đủ người (khóa tự động)'
                        : team.isRecruiting
                        ? ` — Cần ít nhất 7 người để dừng (còn thiếu ${Math.max(0, 7 - team.players.length)} người)`
                        : ' — Nhấn để mở tuyển lại'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggleRecruitBtn,
                    team.isRecruiting ? styles.toggleRecruitBtnStop : styles.toggleRecruitBtnOpen,
                    (togglingRecruiting || team.players.length >= 14) && { opacity: 0.5 },
                  ]}
                  onPress={handleToggleRecruiting}
                  disabled={togglingRecruiting || team.players.length >= 14}
                >
                  {togglingRecruiting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons
                        name={team.isRecruiting ? 'lock-closed-outline' : 'people-outline'}
                        size={16}
                        color="white"
                      />
                      <Text style={styles.toggleRecruitBtnText}>
                        {team.isRecruiting ? 'Dừng tuyển' : 'Mở tuyển lại'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Players List */}
            <Text style={styles.sectionTitle}>
              Thành viên ({team.players.length}/14)
            </Text>

            {team.players.length === 0 ? (
              <View style={styles.emptyPlayersBox}>
                <Text style={styles.emptyPlayersText}>Đội chưa có thành viên nào khác.</Text>
              </View>
            ) : (
              team.players.map((player) => {
                const isPlayerCaptain =
                  team.captainId?._id === user?.id
                    ? player._id === myProfileId
                    : false;
                // Xác định đây có phải là profile của đội trưởng không (để ẩn nút kick)
                const isThisCaptainsProfile =
                  isCaptain && player._id === myProfileId;
                const isBeingKicked = kickingId === player._id;

                return (
                  <View key={player._id} style={styles.playerCard}>
                    <View style={styles.playerAvatar}>
                      <Ionicons name="person" size={20} color="white" />
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>
                        {player.fullName}
                        {isThisCaptainsProfile && (
                          <Text style={{ color: '#f59e0b', fontSize: 13 }}> 👑 Đội trưởng</Text>
                        )}
                      </Text>
                      <Text style={styles.playerPos}>{player.position} • {player.location}</Text>
                    </View>
                    {/* Nút kick — chỉ đội trưởng, không kick chính mình */}
                    {isCaptain && !isThisCaptainsProfile && (
                      <TouchableOpacity
                        style={[styles.kickBtn, isBeingKicked && { opacity: 0.5 }]}
                        onPress={() => handleKick(player._id, player.fullName)}
                        disabled={isBeingKicked}
                      >
                        {isBeingKicked ? (
                          <ActivityIndicator size="small" color="#ef4444" />
                        ) : (
                          <Ionicons name="remove-circle-outline" size={22} color="#ef4444" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },

  // Notification badge in header
  badgeWrap: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  notifBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#ef4444', borderRadius: 8,
    minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  notifBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  scrollContent: { padding: 16, paddingBottom: 40 },

  // Empty State
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 60, padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#334155', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
  createBtn: { flexDirection: 'row', backgroundColor: '#16a34a', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  createBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // Team Card
  teamCard: { backgroundColor: 'white', borderRadius: 20, padding: 16, marginBottom: 24, elevation: 3 },
  teamHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logoWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden' },
  logo: { width: '100%', height: '100%' },
  teamTitleInfo: { flex: 1 },
  teamName: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#92400e' },
  badgeOpen: { backgroundColor: '#dcfce7' },
  badgeTextOpen: { color: '#166534' },
  badgeClosed: { backgroundColor: '#fee2e2' },
  badgeTextClosed: { color: '#991b1b' },
  teamDetails: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, gap: 8 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 14, color: '#475569', flex: 1 },

  // Join Requests Section
  requestsSection: {
    backgroundColor: 'white', borderRadius: 20,
    padding: 16, marginBottom: 24, elevation: 2,
    borderWidth: 1, borderColor: '#fee2e2',
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  emptyRequestsBox: { padding: 16, alignItems: 'center' },
  emptyRequestsText: { color: '#94a3b8', fontSize: 14, fontStyle: 'italic' },

  requestCard: {
    backgroundColor: '#f8fafc', borderRadius: 14,
    padding: 12, marginBottom: 10,
  },
  reqPlayerInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reqAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#3b82f6', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  reqName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  reqSub: { fontSize: 13, color: '#64748b' },
  reqActions: { flexDirection: 'row', gap: 10 },
  reqBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 10,
    borderRadius: 10, gap: 6,
  },
  approveBtn: { backgroundColor: '#22c55e' },
  rejectBtn: { backgroundColor: '#ef4444' },
  reqBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },

  // Players
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16, marginLeft: 4 },
  emptyPlayersBox: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, alignItems: 'center' },
  emptyPlayersText: { color: '#64748b', fontSize: 14, fontStyle: 'italic' },
  playerCard: {
    flexDirection: 'row', backgroundColor: 'white',
    padding: 12, borderRadius: 12, marginBottom: 12,
    alignItems: 'center', elevation: 1,
  },
  playerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  playerPos: { fontSize: 13, color: '#64748b' },
  kickBtn: { padding: 8 },

  // Recruiting toggle section
  recruitingSection: {
    backgroundColor: 'white', borderRadius: 16,
    padding: 14, marginBottom: 20, elevation: 2,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  recruitingInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  recruitingTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  recruitingSubText: { fontSize: 12, color: '#64748b', flexShrink: 1 },
  toggleRecruitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10, gap: 6,
  },
  toggleRecruitBtnStop: { backgroundColor: '#ef4444' },
  toggleRecruitBtnOpen: { backgroundColor: '#22c55e' },
  toggleRecruitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
});
