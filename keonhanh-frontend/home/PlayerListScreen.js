import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config/api";
import { AuthContext } from "../auth/AuthContext";

export default function PlayerListScreen() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchPlayers();
  }, []);

  // =========================
  // GET PLAYERS
  // =========================
  const fetchPlayers = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/players`);
      const json = await res.json();

      const filteredPlayers = (json.players || []).filter(
        (player) => player.isLookingForTeam === true
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

      if (!user.teamId) {
        Alert.alert("Lỗi", "Bạn chưa có đội");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: user.teamId,
          captainId: user._id, // FIX CHÍNH
          playerProfileId,
        }),
      });

      const data = await res.json();

      console.log("INVITE RESPONSE:", data);

      if (data.success) {
        Alert.alert("Thành công", "Đã thêm cầu thủ vào đội thành công!");
      } else {
        Alert.alert("Thất bại", data.message || "Không thể mời");
      }
    } catch (error) {
      console.log("Invite error:", error);
      Alert.alert("Lỗi", "Không thể gửi lời mời");
    }
  };

  // =========================
  // RENDER ITEM
  // =========================
  const renderPlayerCard = ({ item }) => (
    <View style={styles.playerCard}>
      <View style={styles.playerHeader}>
        <Image
          source={{
            uri:
              item.avatar ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.avatarImage}
        />

        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.fullName}</Text>
          <Text style={styles.playerDetail}>⚽ {item.position}</Text>
          <Text style={styles.playerDetail}>📍 {item.location}</Text>
          <Text style={styles.playerDetail}>
            📞 {item.phone || "Không có thông tin"}
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => invitePlayer(item._id)}
        >
          <Ionicons name="mail-outline" size={16} color="white" />
          <Text style={styles.inviteButtonText}>Mời Đá</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Tìm Đồng Đội 👥</Text>
            <Text style={styles.title}>Danh sách cầu thủ</Text>
          </View>

          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải danh sách...</Text>
          </View>
        ) : players.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có cầu thủ nào</Text>
          </View>
        ) : (
          <FlatList
            data={players}
            keyExtractor={(item) => item._id}
            renderItem={renderPlayerCard}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// =========================
// STYLES (FIX CHẮC CHẮN CÓ styles)
// =========================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },

  hello: {
    fontSize: 16,
    color: "#666",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 4,
  },

  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
  },

  playerCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 18,
  },

  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
  },

  playerInfo: {
    flex: 1,
  },

  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },

  playerDetail: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },

  buttonRow: {
    flexDirection: "row",
  },

  inviteButton: {
    backgroundColor: "#22c55e",
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  inviteButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 8,
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  loadingText: {
    fontSize: 16,
    color: "#888",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyText: {
    fontSize: 16,
    color: "#888",
  },

  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 16,
  },
});