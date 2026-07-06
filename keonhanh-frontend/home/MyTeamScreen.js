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
  const { user, updateUser } = useContext(AuthContext);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  const fetchMyTeam = async () => {
    if (!user?._id) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/teams/my-team/${user._id}`
      );

      const data = await res.json();

      console.log("TEAM DATA:", data);

      if (res.ok && data.success) {
        setTeam(data.data);
      } else {
        setTeam(null);
      }

    } catch (err) {
      Alert.alert("Lỗi", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchInvitations = async () => {
    if (!user?.token) {
        setInvitations([]);
        return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/invitations/me`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const data = await res.json();
      console.log("INVITATIONS:", data);

      if (data.success) {
        setInvitations(data.data || []);
      }
    } catch (err) {
      console.log(err);
    }
  };

const handleAccept = async (id) => {
  try {
    setProcessingId(id);

    const res = await fetch(
      `${API_BASE_URL}/api/invitations/${id}/accept`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    const data = await res.json();

    if (!data.success) {
      Alert.alert("Lỗi", data.message);
      return;
    }

    Alert.alert("Thành công", "Bạn đã tham gia đội.");

    await fetchInvitations();

    const teamRes = await fetch(
      `${API_BASE_URL}/api/teams/my-team/${user._id}`
    );

    const teamData = await teamRes.json();

    setTeam(teamData?.data || teamData?.team || null);

  } catch (err) {
    Alert.alert("Lỗi", err.message);
  } finally {
    setProcessingId(null);
  }
};

const handleReject = async (id) => {
  try {
    setProcessingId(id);

    const res = await fetch(
      `${API_BASE_URL}/api/invitations/${id}/reject`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    const data = await res.json();

    if (data.success) {
      await fetchInvitations();
    } else {
      Alert.alert("Lỗi", data.message);
    }
  } catch (err) {
    Alert.alert("Lỗi", err.message);
  } finally {
    setProcessingId(null);
  }
};

  useEffect(() => {
    fetchMyTeam();
    fetchInvitations();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyTeam();
    fetchInvitations();
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#22c55e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đội bóng của tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {!team && invitations.length > 0 && (
      <View style={styles.invitationBox}>
        <Text style={styles.invitationTitle}>
          Lời mời tham gia đội ({invitations.length})
        </Text>

      {invitations.map((item) => (
        <View key={item._id} style={styles.invitationCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.invitationTeam}>
              {item.teamId?.name}
            </Text>

            <Text style={styles.invitationSub}>
              📍 {item.teamId?.location}
            </Text>

            <Text style={styles.invitationSub}>
              Đội trưởng: {item.captainId?.username}
            </Text>
          </View>

          {processingId === item._id ? (
            <ActivityIndicator color="#22c55e" />
          ) : (
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleReject(item._id)}
              >
                <Ionicons
                  name="close"
                  size={18}
                  color="white"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAccept(item._id)}
              >
                <Ionicons
                  name="checkmark"
                  size={18}
                  color="white"
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </View>
  )}
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

            {/* Players List */}
            <Text style={styles.sectionTitle}>
              Thành viên ({team.players.length})
            </Text>

            {team.players.length === 0 ? (
              <View style={styles.emptyPlayersBox}>
                <Text style={styles.emptyPlayersText}>Đội chưa có thành viên nào khác.</Text>
              </View>
            ) : (
              team.players
              .filter(p => p)
              .map((player) => (
                <View key={player._id} style={styles.playerCard}>
                  <View style={styles.playerAvatar}>
                    <Ionicons name="person" size={20} color="white" />
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.fullName}</Text>
                    <Text style={styles.playerPos}>{player.position} • {player.location}</Text>
                  </View>
                </View>
              ))
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

  // Players
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 16, marginLeft: 4 },
  emptyPlayersBox: { backgroundColor: '#f1f5f9', padding: 16, borderRadius: 12, alignItems: 'center' },
  emptyPlayersText: { color: '#64748b', fontSize: 14, fontStyle: 'italic' },

  playerCard: { flexDirection: 'row', backgroundColor: 'white', padding: 12, borderRadius: 12, marginBottom: 12, alignItems: 'center', elevation: 1 },
  playerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  playerName: { fontSize: 15, fontWeight: 'bold', color: '#1e293b', marginBottom: 2 },
  playerPos: { fontSize: 13, color: '#64748b' },
  invitationBox: {
  marginBottom: 20,
},

invitationTitle: {
  fontSize: 18,
  fontWeight: "bold",
  marginBottom: 10,
  color: "#0f172a",
},

invitationCard: {
  backgroundColor: "white",
  borderRadius: 12,
  padding: 14,
  marginBottom: 12,
  flexDirection: "row",
  alignItems: "center",
  elevation: 2,
},

invitationTeam: {
  fontSize: 16,
  fontWeight: "bold",
  color: "#111827",
},

invitationSub: {
  fontSize: 13,
  color: "#64748b",
  marginTop: 2,
},

acceptBtn: {
  backgroundColor: "#16a34a",
  width: 40,
  height: 40,
  borderRadius: 20,
  justifyContent: "center",
  alignItems: "center",
  marginLeft: 8,
},

rejectBtn: {
  backgroundColor: "#ef4444",
  width: 40,
  height: 40,
  borderRadius: 20,
  justifyContent: "center",
  alignItems: "center",
},
});
