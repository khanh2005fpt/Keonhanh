import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const team = selectedTeamId ? teams.find(t => t._id === selectedTeamId) : null;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myProfileId, setMyProfileId] = useState(null);
  // Danh sách yêu cầu gia nhập (chỉ đội trưởng thấy)
  const [joinRequests, setJoinRequests] = useState([]);
  const [processingId, setProcessingId] = useState(null); // request đang xử lý
  const [processingAction, setProcessingAction] = useState(null); // 'approve' hoặc 'reject'
  const [kickingId, setKickingId] = useState(null); // player đang bị kick
  const [togglingRecruiting, setTogglingRecruiting] = useState(false); // đang toggle trạng thái tuyển quân
  const [invitations, setInvitations] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const fetchMyTeam = async () => {
    const userId = user?.id || user?._id;
    if (!userId) return;

    try {
      const profileRes = await fetch(`${API_BASE_URL}/api/user-profiles/${userId}`);
      const profileData = await profileRes.json();

      if (!profileRes.ok || !profileData.profile) {
        setTeams([]);
        setLoading(false);
        setRefreshing(false);
        Alert.alert(
          'Chưa có hồ sơ',
          'Bạn cần tạo hồ sơ cá nhân trước khi quản lý đội bóng.',
          [
            { text: 'Tạo hồ sơ ngay', onPress: () => navigation.navigate('profile') },
            { text: 'Để sau', style: 'cancel' }
          ]
        );
        return;
      }

      const profileId = profileData.profile._id;
      setMyProfileId(profileId);

      // 2. Lấy đội bóng theo đúng profileId
      const res = await fetch(`${API_BASE_URL}/api/teams/my-team/${profileId}`);
      const data = await res.json();

      //console.log("TEAM DATA:", data);

      if (res.ok && data.success) {
        setTeams(data.data);

        const currentTeam = selectedTeamId ? data.data.find(t => t._id === selectedTeamId) : null;

        // 3. Nếu user là đội trưởng của bất kỳ đội nào → lấy danh sách yêu cầu gia nhập
        const isCaptainOfAny = data.data.some(t => t.captainId?._id === userId || t.captainId === userId);

        if (isCaptainOfAny) {
          await fetchJoinRequests();
        }
      } else {
        setTeams([]);
        await fetchSentRequests(profileId);
      }

    } catch (err) {
      Alert.alert("Lỗi", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const fetchJoinRequests = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/join-requests/captain/${user?._id || user?.id}`);
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

  const fetchSentRequests = async (profileId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/join-requests/player/${profileId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setSentRequests(data.data);
      } else {
        setSentRequests([]);
      }
    } catch (err) {
      console.log('Lỗi fetch sent requests:', err);
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
      //console.log("INVITATIONS:", data);

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
      setProcessingAction('approve');

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

      await fetchMyTeam();

    } catch (err) {
      Alert.alert("Lỗi", err.message);
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleRejectInvitation = async (id) => {
    try {
      setProcessingId(id);
      setProcessingAction('reject');

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
  useFocusEffect(
    useCallback(() => {
      fetchMyTeam();
      fetchInvitations();

    }, [user])
  );


  const onRefresh = () => {
    setRefreshing(true);
    fetchMyTeam();
    fetchInvitations();
  };

  // Đội trưởng phê duyệt
  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    setProcessingAction('approve');
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
  const handleRejectRequest = async (requestId) => {
    setProcessingId(requestId);
    setProcessingAction('reject');
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
                body: JSON.stringify({ captainUserId: user._id || user.id }),
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

  const currentUserId = user?.id || user?._id;
  const isCaptain =
    team && currentUserId &&
    (team.captainId?._id === currentUserId || team.captainId === currentUserId);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#16a34a" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.hello}>Quản Lý 🛡️</Text>
            <Text style={styles.headerTitle}>Đội Của Tôi</Text>
          </View>
        </View>
        {/* Badge yêu cầu gia nhập */}
        {isCaptain && joinRequests.filter(req => req.teamId?._id === team._id || req.teamId === team._id).length > 0 ? (
          <View style={styles.badgeWrap}>
            <Ionicons name="notifications" size={26} color="white" />
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{joinRequests.filter(req => req.teamId?._id === team._id || req.teamId === team._id).length}</Text>
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

                {processingId === item._id && processingAction === 'approve' && (
                  <ActivityIndicator color="#22c55e" />
                )}
                {processingId === item._id && processingAction === 'reject' && (
                  <ActivityIndicator color="#ef4444" />
                )}
                {processingId !== item._id && (
                  <View style={{ flexDirection: "row" }}>
                    <TouchableOpacity
                      style={styles.invitationRejectBtn}
                      onPress={() => handleRejectInvitation(item._id)}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color="#ef4444"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.invitationAcceptBtn}
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
        {!team && sentRequests.length > 0 && (
          <View style={styles.invitationBox}>
            <Text style={styles.invitationTitle}>
              Yêu cầu đã gửi ({sentRequests.length})
            </Text>
            {sentRequests.map((item) => (
              <View key={item._id} style={styles.invitationCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invitationTeam}>{item.teamId?.name}</Text>
                  <Text style={styles.invitationSub}>📍 {item.teamId?.location}</Text>
                  <Text style={styles.invitationSub}>Đội trưởng: {item.teamId?.captainId?.username || 'Ẩn danh'}</Text>
                </View>
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f1f5f9', borderRadius: 8 }}>
                  <Text style={{ color: '#64748b', fontSize: 13, fontWeight: 'bold' }}>Đang chờ duyệt</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        {!team && teams.length > 0 ? (
          <View style={{ gap: 12 }}>
            <Text style={styles.sectionTitle}>Các đội bạn đã tham gia ({teams.length})</Text>
            {teams.map(t => (
              <TouchableOpacity
                key={t._id}
                style={styles.teamCardList}
                onPress={() => setSelectedTeamId(t._id)}
              >
                <View style={styles.teamHeaderList}>
                  <View style={styles.logoWrapList}>
                    {t.logo && t.logo.startsWith('data:image') ? (
                      <Image source={{ uri: t.logo }} style={styles.logo} resizeMode="cover" />
                    ) : (
                      <Ionicons name="shield" size={32} color="#22c55e" />
                    )}
                  </View>
                  <View style={styles.teamTitleInfo}>
                    <Text style={styles.teamName}>{t.name}</Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.badge}>
                        <Ionicons name="people" size={12} color="#f59e0b" />
                        <Text style={styles.badgeText}>{t.players?.length}/14 thành viên</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : !team ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="shield-half-outline" size={54} color="#86efac" />
            </View>
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
            {/* Team Selector / Back Button */}
            <TouchableOpacity style={styles.backToListBtn} onPress={() => setSelectedTeamId(null)}>
              <Ionicons name="arrow-back" size={20} color="#475569" />
              <Text style={styles.backToListText}>Danh sách đội</Text>
            </TouchableOpacity>

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
                  <Text style={styles.detailText}>Đội trưởng: {
                    team.players?.find(p => p.userId == (team.captainId?._id || team.captainId))?.fullName || team.captainId?.username
                  }</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => navigation.navigate('teamChat', { teamId: team._id, teamName: team.name })}
              >
                <Ionicons name="chatbubbles" size={20} color="white" />
                <Text style={styles.chatBtnText}>Vào Nhóm Chat</Text>
              </TouchableOpacity>
            </View>

            {/* ========== SECTION: YÊU CẦU GIA NHẬP (chỉ đội trưởng) ========== */}
            {isCaptain && (
              <View style={styles.requestsSection}>
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="notifications-outline" size={20} color="#ef4444" />
                  <Text style={styles.sectionTitle}>
                    Yêu cầu gia nhập
                    {joinRequests.filter(req => req.teamId?._id === team._id || req.teamId === team._id).length > 0 && (
                      <Text style={{ color: '#ef4444' }}> ({joinRequests.filter(req => req.teamId?._id === team._id || req.teamId === team._id).length})</Text>
                    )}
                  </Text>
                </View>

                {joinRequests.filter(req => req.teamId?._id === team._id || req.teamId === team._id).length === 0 ? (
                  <View style={styles.emptyRequestsBox}>
                    <Text style={styles.emptyRequestsText}>Không có yêu cầu nào đang chờ.</Text>
                  </View>
                ) : (
                  joinRequests.filter(req => req.teamId?._id === team._id || req.teamId === team._id).map((req) => {
                    const p = req.requesterId;
                    const isProcessingApprove = processingId === req._id && processingAction === 'approve';
                    const isProcessingReject = processingId === req._id && processingAction === 'reject';
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
                            style={[styles.reqBtn, styles.approveBtn, isProcessingApprove && { opacity: 0.6 }]}
                            onPress={() => handleApprove(req._id)}
                            disabled={processingId !== null}
                          >
                            {isProcessingApprove ? (
                              <ActivityIndicator size="small" color="white" />
                            ) : (
                              <>
                                <Ionicons name="checkmark" size={16} color="white" />
                                <Text style={styles.reqBtnText}>Phê duyệt</Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.reqBtn, styles.rejectBtn, isProcessingReject && { opacity: 0.6 }]}
                            onPress={() => handleRejectRequest(req._id)}
                            disabled={processingId !== null}
                          >
                            {isProcessingReject ? (
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
  container: { flex: 1, backgroundColor: '#f4fdf4' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4fdf4' },

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
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginRight: 12, elevation: 2 },
  headerTextWrap: { justifyContent: 'center' },
  hello: { fontSize: 13, color: '#dcfce7', fontWeight: '600', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: 'white' },

  // Notification badge in header
  badgeWrap: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 22 },
  notifBadge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: '#ef4444', borderRadius: 10,
    minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#16a34a'
  },
  notifBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  scrollContent: { padding: 16, paddingTop: 24, paddingBottom: 40 },

  // Empty State
  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 60, padding: 20 },
  emptyIconWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 2, borderColor: '#bbf7d0' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#14532d', marginBottom: 10 },
  emptySub: { fontSize: 14, color: '#166534', textAlign: 'center', marginBottom: 30, paddingHorizontal: 10, lineHeight: 22, fontWeight: '500' },
  createBtn: { flexDirection: 'row', backgroundColor: '#16a34a', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, alignItems: 'center', elevation: 4, shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  createBtnText: { color: 'white', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },

  // Team List View
  teamCardList: { backgroundColor: 'white', borderRadius: 20, padding: 16, elevation: 3, shadowColor: '#16a34a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 8, borderWidth: 1, borderColor: '#dcfce7' },
  teamHeaderList: { flexDirection: 'row', alignItems: 'center' },
  logoWrapList: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#4ade80' },
  backToListBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, padding: 10, backgroundColor: '#f1f5f9', alignSelf: 'flex-start', borderRadius: 12 },
  backToListText: { color: '#475569', fontWeight: 'bold', fontSize: 14, marginLeft: 6 },

  // Team Card
  teamCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 24, elevation: 4, shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, borderWidth: 1, borderColor: '#dcfce7' },
  teamHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logoWrap: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', marginRight: 16, overflow: 'hidden', borderWidth: 3, borderColor: '#4ade80' },
  logo: { width: '100%', height: '100%' },
  teamTitleInfo: { flex: 1, justifyContent: 'center' },
  teamName: { fontSize: 20, fontWeight: '900', color: '#14532d', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#d97706' },
  badgeOpen: { backgroundColor: '#dcfce7' },
  badgeTextOpen: { color: '#16a34a' },
  badgeClosed: { backgroundColor: '#fee2e2' },
  badgeTextClosed: { color: '#dc2626' },
  teamDetails: { backgroundColor: '#f0fdf4', padding: 16, borderRadius: 16, gap: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailText: { fontSize: 14, color: '#166534', flex: 1, fontWeight: '600' },

  chatBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  chatBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Join Requests Section
  requestsSection: {
    backgroundColor: 'white', borderRadius: 24,
    padding: 20, marginBottom: 24, elevation: 4,
    borderWidth: 1, borderColor: '#fecaca',
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  emptyRequestsBox: { padding: 16, alignItems: 'center' },
  emptyRequestsText: { color: '#ef4444', fontSize: 14, fontStyle: 'italic', fontWeight: '500' },

  requestCard: {
    backgroundColor: '#fef2f2', borderRadius: 16,
    padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#fee2e2'
  },
  reqPlayerInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  reqAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#ef4444', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  reqName: { fontSize: 16, fontWeight: '800', color: '#7f1d1d', marginBottom: 2 },
  reqSub: { fontSize: 13, color: '#b91c1c', fontWeight: '500' },
  reqActions: { flexDirection: 'row', gap: 10 },
  reqBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 12,
    borderRadius: 12, gap: 6, elevation: 2
  },
  approveBtn: { backgroundColor: '#22c55e' },
  rejectBtn: { backgroundColor: '#ef4444' },
  reqBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },

  // Players
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#14532d', marginBottom: 16, marginLeft: 4 },
  emptyPlayersBox: { backgroundColor: 'white', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#dcfce7' },
  emptyPlayersText: { color: '#16a34a', fontSize: 14, fontStyle: 'italic', fontWeight: '500' },
  playerCard: {
    flexDirection: 'row', backgroundColor: 'white',
    padding: 14, borderRadius: 16, marginBottom: 12,
    alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#f0fdf4',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6
  },
  playerAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: '800', color: '#14532d', marginBottom: 4 },
  playerPos: { fontSize: 13, color: '#166534', fontWeight: '500' },
  kickBtn: { padding: 10, backgroundColor: '#fee2e2', borderRadius: 12 },

  // Recruiting toggle section
  recruitingSection: {
    backgroundColor: 'white', borderRadius: 20,
    padding: 16, marginBottom: 24, elevation: 3,
    borderWidth: 1, borderColor: '#dcfce7',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8
  },
  recruitingInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  recruitingTitle: { fontSize: 16, fontWeight: '800', color: '#14532d', marginBottom: 4 },
  recruitingSubText: { fontSize: 13, color: '#166534', flexShrink: 1, lineHeight: 20 },
  toggleRecruitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, gap: 8, elevation: 2
  },
  toggleRecruitBtnStop: { backgroundColor: '#ef4444' },
  toggleRecruitBtnOpen: { backgroundColor: '#22c55e' },
  toggleRecruitBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },

  invitationBox: {
    marginBottom: 24,
  },
  invitationTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
    color: "#14532d",
    marginLeft: 4,
  },
  invitationCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    borderWidth: 1,
    borderColor: '#dcfce7',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6
  },
  invitationTeam: {
    fontSize: 17,
    fontWeight: "800",
    color: "#14532d",
    marginBottom: 4,
  },
  invitationSub: {
    fontSize: 13,
    color: "#166534",
    marginTop: 2,
    fontWeight: '500'
  },
  invitationAcceptBtn: {
    backgroundColor: "#16a34a",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    elevation: 2
  },
  invitationRejectBtn: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: '#fecaca',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
});
