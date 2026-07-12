import React, { useState, useCallback, useContext, useEffect } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config/api";
import { Image as RNImage } from 'react-native';
import { AuthContext } from "../auth/AuthContext";

export default function PlayerListScreen() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isFilterVisible, setFilterVisible] = useState(false);
  const [filterPosition, setFilterPosition] = useState("Tất cả");
  const [filterLocation, setFilterLocation] = useState("");


  const { user } = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      fetchPlayers();
    }, [])
  );

  // =========================
  // GET PLAYERS
  // =========================
  const fetchPlayers = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/players`);
      const json = await res.json();
      const filteredPlayers = (json.players || []).filter(
        (player) => player.isLookingForTeam !== false,
      );

      setPlayers(filteredPlayers);
    } catch (error) {
      console.log("Error fetchPlayers:", error);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // INVITE PLAYER
  // =========================
  const invitePlayer = async (playerProfileId) => {
    try {
      if (!user) {
        Alert.alert("Lỗi", "Bạn chưa đăng nhập");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          playerProfileId,
        }),
      });

      const data = await res.json();

      //console.log("INVITE RESPONSE:", data);

      if (data.success) {
        Alert.alert("Thành công", "Đã mời cầu thủ vào đội thành công!");
      } else {
        Alert.alert("Thất bại", data.message || "Không thể mời");
      }
    } catch (error) {
      console.log("Invite error:", error);
      Alert.alert("Lỗi", "Không thể gửi lời mời");
    }
  };

  const displayedPlayers = players.filter(player => {
    const matchPosition = filterPosition === "Tất cả" || (player.position && player.position.includes(filterPosition));
    const matchLocation = !filterLocation || (player.location && player.location.toLowerCase().includes(filterLocation.toLowerCase()));
    return matchPosition && matchLocation;
  });

  // =========================
  // RENDER ITEM
  // =========================
  const renderPlayerCard = ({ item }) => (
    <View style={styles.playerCard}>
      <View style={styles.playerHeader}>
        <View style={styles.avatarWrap}>
          <Image
            source={{
              uri:
                (item.avatar && (item.avatar.startsWith('http') || item.avatar.startsWith('data:image')))
                  ? item.avatar
                  : "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            }}
            style={styles.avatarImage}
          />
        </View>

        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.fullName}</Text>

          <View style={styles.detailRow}>
            <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="football" size={14} color="#16a34a" />
            </View>
            <Text style={styles.playerDetail} numberOfLines={1}>{item.position || "Cầu thủ tự do"}</Text>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="location" size={14} color="#22c55e" />
            </View>
            <Text style={styles.playerDetail} numberOfLines={1}>{item.location || "Chưa cập nhật"}</Text>
          </View>

          {item.phone ? (
            <View style={styles.detailRow}>
              <View style={[styles.iconBox, { backgroundColor: '#f8fafc' }]}>
                <Ionicons name="call" size={14} color="#475569" />
              </View>
              <Text style={styles.playerDetail}>{item.phone}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <TouchableOpacity
        style={styles.inviteButton}
        activeOpacity={0.8}
        onPress={() => invitePlayer(item._id)}
      >
        <Ionicons name="mail" size={18} color="white" />
        <Text style={styles.inviteButtonText}>Mời Đá Ngay</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.hello}>Tuyển Quân ⚽</Text>
          <Text style={styles.title}>Tìm Đồng Đội</Text>
        </View>
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.8} onPress={() => setFilterVisible(true)}>
          <Ionicons name="options" size={22} color="#16a34a" />
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Đang tải danh sách...</Text>
        </View>
      ) : displayedPlayers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="people" size={48} color="#86efac" />
          </View>
          <Text style={styles.emptyText}>Chưa có cầu thủ nào phù hợp</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={displayedPlayers}
          keyExtractor={(item) => item._id}
          renderItem={renderPlayerCard}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FILTER MODAL */}
      <Modal
        visible={isFilterVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setFilterVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lọc Cầu Thủ</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={26} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterLabel}>Vị trí thi đấu</Text>
              <View style={styles.positionChips}>
                {["Tất cả", "Tiền đạo", "Tiền vệ", "Hậu vệ", "Thủ môn", "Tự do"].map(pos => (
                  <TouchableOpacity
                    key={pos}
                    style={[styles.chip, filterPosition === pos && styles.chipActive]}
                    onPress={() => setFilterPosition(pos)}
                  >
                    <Text style={[styles.chipText, filterPosition === pos && styles.chipTextActive]}>{pos}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Khu vực / Tỉnh thành</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Nhập khu vực..."
                value={filterLocation}
                onChangeText={setFilterLocation}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setFilterPosition("Tất cả");
                  setFilterLocation("");
                }}
              >
                <Text style={styles.resetButtonText}>Xóa lọc</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setFilterVisible(false)}
              >
                <Text style={styles.applyButtonText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4fdf4", // Nền xanh nhạt màu cỏ dịu mắt
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
    backgroundColor: '#16a34a', // Xanh đậm màu cỏ
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
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: 'white',
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // Player Card Styles
  playerCard: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  playerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#4ade80',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 19,
    fontWeight: "900",
    color: "#14532d",
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  playerDetail: {
    fontSize: 14,
    color: "#166534",
    fontWeight: '600',
    flex: 1,
  },

  inviteButton: {
    backgroundColor: "#16a34a",
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  inviteButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
    marginLeft: 8,
    letterSpacing: 0.5,
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#16a34a",
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  emptyText: {
    fontSize: 16,
    color: "#15803d",
    fontWeight: '700',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: 350,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 10,
    marginBottom: 12,
  },
  positionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
  },
  chipText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: 'white',
    fontWeight: '800',
  },
  filterInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 30,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 10,
    paddingBottom: 20,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 16,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
});