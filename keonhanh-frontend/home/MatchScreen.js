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
  const [matchesByTeam, setMatchesByTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const fetchMyMatches = async () => {
    const userId = user?.id || user?._id;
    if (!userId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const profileRes = await fetch(`${API_BASE_URL}/api/user-profiles/${userId}`);
      const profileData = await profileRes.json();

      if (!profileRes.ok || !profileData.profile) {
        setMatchesByTeam([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const profileId = profileData.profile._id;
      const teamRes = await fetch(`${API_BASE_URL}/api/teams/my-team/${profileId}`);
      const teamData = await teamRes.json();

      if (!teamRes.ok || !teamData.success || !teamData.data) {
        setMatchesByTeam([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const teams = teamData.data;
      if (!teams || teams.length === 0) {
        setMatchesByTeam([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const allTeamMatches = [];
      for (const t of teams) {
        const matchesRes = await fetch(`${API_BASE_URL}/api/matches/my-matches/${t._id}`);
        const matchesData = await matchesRes.json();
        if (matchesRes.ok && matchesData.success) {
          allTeamMatches.push({ team: t, matches: matchesData.data });
        } else {
          allTeamMatches.push({ team: t, matches: [] });
        }
      }

      setMatchesByTeam(allTeamMatches);
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
        <View style={styles.headerTextWrap}>
          <Text style={styles.hello}>Lịch Thi Đấu 🏟️</Text>
          <Text style={styles.headerTitle}>Kèo Của Tôi</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#22c55e"]} />}
        showsVerticalScrollIndicator={false}
      >
        {matchesByTeam.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="shield-half" size={54} color="#86efac" />
            </View>
            <Text style={styles.emptyTitle}>Chưa có đội bóng</Text>
            <Text style={styles.emptySub}>Bạn cần gia nhập hoặc tạo một đội bóng để quản lý kèo đấu.</Text>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => navigation.navigate('createTeam')}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.createBtnText}>Tạo đội ngay</Text>
            </TouchableOpacity>
          </View>
        ) : !selectedTeamId ? (
          <View>
            <Text style={styles.pageTitle}>Chọn đội để xem kèo đấu</Text>
            {matchesByTeam.map((teamGroup) => (
              <TouchableOpacity 
                key={teamGroup.team._id} 
                style={styles.teamGroupContainer}
                onPress={() => setSelectedTeamId(teamGroup.team._id)}
                activeOpacity={0.8}
              >
                <View style={styles.teamGroupHeader}>
                  <View style={styles.teamGroupInfo}>
                    <View style={styles.miniLogo}>
                      {teamGroup.team.logo && (teamGroup.team.logo.startsWith('http') || teamGroup.team.logo.startsWith('data:image')) ? (
                        <Image source={{ uri: teamGroup.team.logo }} style={styles.logoImage} />
                      ) : (
                        <Ionicons name="shield" size={16} color="white" />
                      )}
                    </View>
                    <View>
                      <Text style={styles.sectionTitle}>{teamGroup.team.name}</Text>
                      <Text style={styles.matchCountText}>{teamGroup.matches.length} kèo đấu</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#16a34a" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          (() => {
            const teamGroup = matchesByTeam.find(t => t.team._id === selectedTeamId);
            if (!teamGroup) return null;
            
            return (
              <View>
                <TouchableOpacity style={styles.backToListBtn} onPress={() => setSelectedTeamId(null)}>
                  <Ionicons name="arrow-back" size={20} color="#475569" />
                  <Text style={styles.backToListText}>Danh sách đội</Text>
                </TouchableOpacity>
                
                <Text style={styles.pageTitle}>Kèo của đội: {teamGroup.team.name}</Text>
                
                <View style={styles.matchesListContainer}>
                  {teamGroup.matches.length === 0 ? (
                    <View style={styles.emptyMatchBox}>
                      <Text style={styles.emptyMatchText}>Đội này chưa có kèo nào.</Text>
                      <TouchableOpacity style={styles.createSmallBtn} onPress={() => navigation.navigate('createMatch')}>
                        <Text style={styles.createSmallBtnText}>Tạo kèo ngay</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    teamGroup.matches.map((item) => {
                      const date = new Date(item.playTime);
                      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} - ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
                      const isCreator = item.creatorTeamId?._id === teamGroup.team._id;
                      
                      return (
                        <TouchableOpacity 
                          key={item._id} 
                          style={styles.matchCard}
                          onPress={() => navigation.navigate('matchDetail', { matchId: item._id })}
                          activeOpacity={0.9}
                        >
                          <View style={styles.matchHeader}>
                            <View style={styles.teamInfoWrap}>
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
                                  <Image source={{ uri: item.matchedWithTeamId.logo }} style={[styles.miniLogo, { marginRight: 6 }]} />
                              ) : (
                                <Ionicons name="shield" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
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
                </View>
              </View>
            );
          })()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4fdf4' // Xanh nhạt
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4fdf4'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: '#16a34a', // Xanh đậm
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    elevation: 8,
    shadowColor: '#14532d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  hello: {
    fontSize: 15,
    color: "#dcfce7",
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white'
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40
  },

  // Empty State
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 20
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#14532d',
    marginBottom: 10
  },
  emptySub: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
    fontWeight: '500'
  },
  createBtn: {
    flexDirection: 'row',
    backgroundColor: '#16a34a',
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
    fontSize: 15,
    marginLeft: 8,
    letterSpacing: 0.5
  },

  // Card Design
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#dcfce7',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#14532d',
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
    fontWeight: '900',
    color: '#14532d',
    flex: 1
  },
  badge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  badgeMatched: {
    backgroundColor: '#fee2e2'
  },
  badgeText: {
    color: '#16a34a',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5
  },
  badgeTextMatched: {
    color: '#dc2626'
  },

  versusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
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
    fontWeight: '800',
    color: '#14532d',
    flex: 1
  },

  matchDetails: {
    marginBottom: 16
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  detailText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
    flex: 1
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0fdf4',
    paddingTop: 16
  },
  roleText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600'
  },
  roleHighlight: {
    color: '#14532d',
    fontWeight: '800'
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#14532d',
    marginBottom: 16,
    marginLeft: 4
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14532d',
    flexShrink: 1
  },
  matchCountText: {
    fontSize: 13,
    color: '#166534',
    marginTop: 4
  },
  backToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#e2e8f0',
    alignSelf: 'flex-start',
    borderRadius: 12
  },
  backToListText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6
  },
  emptyMatchBox: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dcfce7'
  },
  emptyMatchText: {
    color: '#16a34a',
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '600',
    marginBottom: 12
  },
  createSmallBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  createSmallBtnText: {
    color: 'white',
    fontWeight: 'bold'
  },
  teamGroupContainer: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
    overflow: 'hidden'
  },
  teamGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f0fdf4'
  },
  teamGroupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  matchesListContainer: {
    marginTop: 8
  }
});
