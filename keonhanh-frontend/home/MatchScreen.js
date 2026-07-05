import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';
import { AuthContext } from '../auth/AuthContext';

export default function MatchScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myTeam, setMyTeam] = useState(null);

  const fetchMyMatches = async () => {
    if (!user?.id) return;
    try {
      const profileRes = await fetch(`${API_BASE_URL}/api/user-profiles/${user.id}`);
      const profileData = await profileRes.json();

      if (!profileRes.ok || !profileData.profile) {
        setMatches([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const profileId = profileData.profile._id;
      const teamRes = await fetch(`${API_BASE_URL}/api/teams/my-team/${profileId}`);
      const teamData = await teamRes.json();
      
      if (!teamRes.ok || !teamData.success || !teamData.data) {
        setMatches([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const team = teamData.data;
      setMyTeam(team);

      const matchesRes = await fetch(`${API_BASE_URL}/api/matches/my-matches/${team._id}`);
      const matchesData = await matchesRes.json();
      
      if (matchesRes.ok && matchesData.success) {
        setMatches(matchesData.data);
      } else {
        setMatches([]);
      }
    } catch (error) {
      console.log('Lỗi fetch matches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyMatches();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyMatches();
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Kèo Đấu Của Tôi</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />}
        showsVerticalScrollIndicator={false}
      >
        {!myTeam ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="shield-half" size={60} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có đội bóng</Text>
            <Text style={styles.emptySub}>Bạn cần gia nhập hoặc tạo một đội bóng để quản lý kèo đấu.</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('createTeam')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.createBtnText}>Tạo đội ngay</Text>
            </TouchableOpacity>
          </View>
        ) : matches.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="football" size={60} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có kèo đấu nào</Text>
            <Text style={styles.emptySub}>Đội của bạn hiện chưa tạo hoặc bắt kèo nào cả. Hãy tìm đối thủ ngay!</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('createMatch')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.createBtnText}>Tạo kèo mới</Text>
            </TouchableOpacity>
          </View>
        ) : (
          matches.map((item) => {
            const date = new Date(item.playTime);
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} - ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            const isCreator = item.creatorTeamId?._id === myTeam._id;
            
            return (
              <TouchableOpacity 
                key={item._id} 
                style={styles.matchCard}
                onPress={() => navigation.navigate('matchDetail', { matchId: item._id })}
                activeOpacity={0.9}
              >
                <View style={styles.matchHeader}>
                  <View style={styles.teamInfoWrap}>
                    <View style={styles.miniLogo}>
                      {item.creatorTeamId?.logo && (item.creatorTeamId.logo.startsWith('http') || item.creatorTeamId.logo.startsWith('data:image')) ? (
                        <Image source={{ uri: item.creatorTeamId.logo }} style={styles.logoImage} />
                      ) : (
                        <Ionicons name="shield" size={16} color="white" />
                      )}
                    </View>
                    <Text style={styles.teamName} numberOfLines={1}>
                      {item.creatorTeamId?.name || 'Đội ẩn danh'}
                    </Text>
                  </View>
                  <View style={[styles.badge, item.status === 'matched' ? styles.badgeMatched : {}]}>
                    <Text style={[styles.badgeText, item.status === 'matched' ? styles.badgeTextMatched : {}]}>
                      {item.status === 'open' ? 'ĐANG TÌM ĐỐI' : 
                       item.status === 'matched' ? 'ĐÃ CHỐT KÈO' : 
                       item.status === 'finished' ? 'ĐÃ KẾT THÚC' : 
                       item.status === 'cancelled' ? 'ĐÃ HỦY' : item.status}
                    </Text>
                  </View>
                </View>

                {item.status === 'matched' && item.matchedWithTeamId && (
                  <View style={styles.versusWrap}>
                    <Text style={styles.vsText}>VS</Text>
                    {item.matchedWithTeamId.logo && (item.matchedWithTeamId.logo.startsWith('http') || item.matchedWithTeamId.logo.startsWith('data:image')) ? (
                        <Image source={{ uri: item.matchedWithTeamId.logo }} style={[styles.miniLogo, {marginRight: 6}]} />
                    ) : (
                      <Ionicons name="shield" size={16} color="#94a3b8" style={{marginRight: 6}} />
                    )}
                    <Text style={styles.matchedTeamName} numberOfLines={1}>{item.matchedWithTeamId.name}</Text>
                  </View>
                )}

                <View style={styles.matchDetails}>
                  <View style={styles.detailItem}>
                    <View style={styles.iconBox}>
                      <Ionicons name="location" size={14} color="#3b82f6" />
                    </View>
                    <Text style={styles.detailText} numberOfLines={1}>{item.fieldName}</Text>
                  </View>
                  
                  <View style={styles.detailItem}>
                    <View style={styles.iconBox}>
                      <Ionicons name="time" size={14} color="#f59e0b" />
                    </View>
                    <Text style={styles.detailText}>{timeStr}</Text>
                  </View>
                </View>

                <View style={styles.footerRow}>
                  <Text style={styles.roleText}>Vai trò: <Text style={styles.roleHighlight}>{isCreator ? 'Đội chủ nhà' : 'Đội khách'}</Text></Text>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 16, 
    backgroundColor: 'white', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#0f172a' 
  },
  scrollContent: { 
    padding: 16, 
    paddingBottom: 40 
  },
  
  // Empty State
  emptyBox: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 80, 
    paddingHorizontal: 20 
  },
  emptyIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  emptyTitle: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#1e293b', 
    marginBottom: 10 
  },
  emptySub: { 
    fontSize: 15, 
    color: '#64748b', 
    textAlign: 'center', 
    marginBottom: 30,
    lineHeight: 22
  },
  createBtn: { 
    flexDirection: 'row', 
    backgroundColor: '#22c55e', 
    paddingHorizontal: 24, 
    paddingVertical: 14, 
    borderRadius: 16, 
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },
  createBtnText: { 
    color: 'white', 
    fontWeight: '800', 
    fontSize: 16,
    marginLeft: 6
  },

  // Card Design
  matchCard: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 16, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  matchHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  teamInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  miniLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden'
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  teamName: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: '#0f172a',
    flex: 1
  },
  badge: { 
    backgroundColor: '#dcfce7', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 10 
  },
  badgeMatched: { 
    backgroundColor: '#fee2e2' 
  },
  badgeText: { 
    color: '#16a34a', 
    fontWeight: '800', 
    fontSize: 11,
    letterSpacing: 0.5 
  },
  badgeTextMatched: { 
    color: '#dc2626' 
  },
  
  versusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444'
  },
  vsText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ef4444',
    marginRight: 12,
    fontStyle: 'italic'
  },
  matchedTeamName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    flex: 1
  },

  matchDetails: {
    marginBottom: 16
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  detailText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '500',
    flex: 1
  },

  footerRow: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1, 
    borderTopColor: '#f1f5f9', 
    paddingTop: 16
  },
  roleText: { 
    fontSize: 13, 
    color: '#94a3b8', 
    fontWeight: '500' 
  },
  roleHighlight: {
    color: '#334155',
    fontWeight: '700'
  }
});
