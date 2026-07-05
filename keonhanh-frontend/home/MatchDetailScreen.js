import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView, ImageBackground, Image, Linking } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';
import { AuthContext } from '../auth/AuthContext';

export default function MatchDetailScreen({ route, navigation }) {
  const { matchId } = route.params;
  const { user } = useContext(AuthContext);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchMatchDetails();
    if (user?.id) {
      fetchMyTeam();
    }
  }, [matchId, user]);

  const fetchMatchDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}`);
      const data = await res.json();
      if (res.ok) {
        setMatch(data);
      } else {
        Alert.alert('Lỗi', data.message || 'Không tìm thấy kèo.');
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTeam = async () => {
    try {
      const profileRes = await fetch(`${API_BASE_URL}/api/user-profiles/${user.id}`);
      const profileData = await profileRes.json();
      if (profileRes.ok && profileData.profile) {
        const teamRes = await fetch(`${API_BASE_URL}/api/teams/my-team/${profileData.profile._id}`);
        const teamData = await teamRes.json();
        if (teamRes.ok && teamData.success) {
          setMyTeam(teamData.data);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleMatch = async () => {
    if (!myTeam) {
      Alert.alert('Lỗi', 'Bạn chưa có đội bóng. Vui lòng tạo hoặc tham gia đội bóng trước!');
      return;
    }

    const captainId = myTeam.captainId?._id || myTeam.captainId;

    if (captainId !== user.id) {
      Alert.alert('Lỗi', 'Chỉ đội trưởng mới có quyền bắt kèo với đội khác.');
      return;
    }

    if (match.creatorTeamId?._id === myTeam._id) {
      Alert.alert('Lỗi', 'Bạn không thể bắt kèo của chính đội mình.');
      return;
    }

    Alert.alert(
      'Xác nhận nhận kèo',
      'Bạn có chắc chắn muốn bắt kèo này với đội của mình không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bắt kèo',
          onPress: async () => {
            setProcessing(true);
            try {
              const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}/match`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchedWithTeamId: myTeam._id, userId: user.id }),
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('🎉 Thành công', 'Bắt kèo thành công!');
                fetchMatchDetails();
              } else {
                Alert.alert('Lỗi', data.message || 'Không thể bắt kèo.');
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Lỗi kết nối.');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handleCancelMatch = async () => {
    if (!myTeam) return;

    const captainId = myTeam.captainId?._id || myTeam.captainId;

    if (captainId !== user.id) {
      Alert.alert('Lỗi', 'Chỉ đội trưởng mới có quyền hủy kèo.');
      return;
    }

    Alert.alert(
      'Xác nhận hủy kèo',
      'Bạn có chắc chắn muốn hủy kèo này không? Kèo sẽ trở lại trạng thái Đang mở.',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy kèo',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              const res = await fetch(`${API_BASE_URL}/api/matches/${matchId}/cancel`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
              });
              const data = await res.json();
              if (res.ok) {
                Alert.alert('Thành công', 'Hủy kèo thành công!');
                fetchMatchDetails();
              } else {
                Alert.alert('Lỗi', data.message || 'Không thể hủy kèo.');
              }
            } catch (err) {
              Alert.alert('Lỗi', 'Lỗi kết nối.');
            } finally {
              setProcessing(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return <View style={styles.centerBox}><ActivityIndicator size="large" color="#22c55e" /></View>;
  }

  if (!match) {
    return (
      <View style={styles.centerBox}>
        <Ionicons name="document-text-outline" size={60} color="#cbd5e1" />
        <Text style={styles.emptyText}>Không có thông tin kèo.</Text>
      </View>
    );
  }

  const date = new Date(match.playTime);
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  const dateStr = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  const isMyTeamMatched = myTeam && match.matchedWithTeamId?._id === myTeam._id;
  const isMyTeamCreator = myTeam && match.creatorTeamId?._id === myTeam._id;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi Tiết Kèo Đấu</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Versus Card */}
        <View style={styles.versusCard}>
          <View style={styles.teamContainer}>
            <View style={styles.teamLogoPlaceholder}>
              {match.creatorTeamId?.logo && (match.creatorTeamId.logo.startsWith('http') || match.creatorTeamId.logo.startsWith('data:image')) ? (
                <Image source={{ uri: match.creatorTeamId.logo }} style={styles.logoImage} />
              ) : (
                <Ionicons name="shield" size={40} color="#22c55e" />
              )}
            </View>
            <Text style={styles.teamName} numberOfLines={2}>{match.creatorTeamId?.name || 'Đội chủ nhà'}</Text>
          </View>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
            <View style={[styles.statusBadge, match.status === 'open' ? styles.statusOpen : styles.statusMatched]}>
              <Text style={[styles.statusText, match.status === 'open' ? styles.statusTextOpen : styles.statusTextMatched]}>
                {match.status === 'open' ? 'ĐANG TÌM ĐỐI' :
                  match.status === 'matched' ? 'ĐÃ CHỐT KÈO' :
                    match.status === 'finished' ? 'ĐÃ KẾT THÚC' :
                      match.status === 'cancelled' ? 'ĐÃ HỦY' : match.status}
              </Text>
            </View>
          </View>

          <View style={styles.teamContainer}>
            <View style={[styles.teamLogoPlaceholder, !match.matchedWithTeamId && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}>
              {match.matchedWithTeamId?.logo && (match.matchedWithTeamId.logo.startsWith('http') || match.matchedWithTeamId.logo.startsWith('data:image')) ? (
                <Image source={{ uri: match.matchedWithTeamId.logo }} style={styles.logoImage} />
              ) : (
                <Ionicons name={match.matchedWithTeamId ? "shield" : "help-outline"} size={40} color={match.matchedWithTeamId ? "#ef4444" : "#94a3b8"} />
              )}
            </View>
            <Text style={[styles.teamName, !match.matchedWithTeamId && { color: '#94a3b8' }]} numberOfLines={2}>
              {match.matchedWithTeamId ? match.matchedWithTeamId.name : 'Đang tìm...'}
            </Text>
          </View>
        </View>

        {/* Match Info Details */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Thông tin trận đấu</Text>

          <View style={styles.infoRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="calendar" size={20} color="#3b82f6" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Ngày thi đấu</Text>
              <Text style={styles.infoValue}>{dateStr}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="time" size={20} color="#f59e0b" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Thời gian</Text>
              <Text style={styles.infoValue}>{timeStr}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="location" size={20} color="#ef4444" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Khu vực</Text>
              <Text style={styles.infoValue}>{match.location}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.iconWrap}>
              <Ionicons name="business" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Tên sân / Địa chỉ cụ thể</Text>
              <Text style={styles.infoValue}>{match.fieldName}</Text>
            </View>
          </View>
          
          {match.latitude && match.longitude && (
            <View style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' }}>
              <MapView
                style={{ height: 150, width: '100%' }}
                initialRegion={{
                  latitude: match.latitude,
                  longitude: match.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker 
                  coordinate={{ latitude: match.latitude, longitude: match.longitude }} 
                  title={match.fieldName}
                />
              </MapView>
              <TouchableOpacity 
                style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'white', padding: 8, borderRadius: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 }}
                onPress={() => {
                  const url = `https://www.google.com/maps/search/?api=1&query=${match.latitude},${match.longitude}`;
                  Linking.openURL(url);
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#3b82f6' }}>Mở Google Maps</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {match.status === 'open' && !isMyTeamCreator && (
            <TouchableOpacity
              style={[styles.matchBtn, processing && { opacity: 0.7 }]}
              onPress={handleMatch}
              disabled={processing}
              activeOpacity={0.8}
            >
              <View style={styles.btnInner}>
                {processing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="flash" size={22} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.matchBtnText}>Bắt Kèo Ngay</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}

          {match.status === 'open' && isMyTeamCreator && (
            <View style={styles.waitingBox}>
              <ActivityIndicator size="small" color="#22c55e" style={{ marginRight: 10 }} />
              <Text style={styles.waitingText}>Đang chờ đối thủ nhận kèo...</Text>
            </View>
          )}

          {match.status === 'matched' && (isMyTeamCreator || isMyTeamMatched) && (
            <TouchableOpacity
              style={[styles.cancelBtn, processing && { opacity: 0.7 }]}
              onPress={handleCancelMatch}
              disabled={processing}
              activeOpacity={0.8}
            >
              {processing ? <ActivityIndicator color="#ef4444" /> : <Text style={styles.cancelBtnText}>Hủy Kèo</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9'
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0'
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },

  // Versus Card
  versusCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  teamContainer: {
    flex: 1,
    alignItems: 'center'
  },
  teamLogoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0fdf4',
    borderWidth: 2,
    borderColor: '#bbf7d0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden'
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  teamName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  vsContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  vsText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#cbd5e1',
    fontStyle: 'italic',
    marginBottom: 8
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#dcfce7',
  },
  statusMatched: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTextOpen: {
    color: '#16a34a',
  },
  statusTextMatched: {
    color: '#dc2626',
  },

  // Info Card
  infoCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  infoTextWrap: {
    flex: 1
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '600'
  },
  infoValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '700'
  },

  // Action Buttons
  actionContainer: {
    marginTop: 10
  },
  matchBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    overflow: 'hidden'
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  matchBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 0.5
  },
  cancelBtn: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#fee2e2',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 16
  },
  waitingBox: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  waitingText: {
    color: '#166534',
    fontWeight: '600',
    fontSize: 15
  }
});
