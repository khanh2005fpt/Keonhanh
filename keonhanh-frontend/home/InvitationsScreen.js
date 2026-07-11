import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../auth/AuthContext";
import { API_BASE_URL } from "../config/api";
import { useFocusEffect } from "@react-navigation/native";

export default function InvitationsScreen() {
  const { user, updateUser } = useContext(AuthContext);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Tự động tải lại khi màn hình được focus
  useFocusEffect(
    useCallback(() => {
      fetchInvitations();
    }, [user])
  );

  const fetchInvitations = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/invitations/me`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();

      if (data.success) {
        setInvitations(data.data || []);
      }
    } catch (err) {
      console.log("Fetch invitations error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAccept = async (invitationId) => {
    try {
      setProcessingId(invitationId);

      const res = await fetch(
        `${API_BASE_URL}/api/invitations/${invitationId}/accept`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        // Cập nhật teamId vào AuthContext
        if (data.teamId) {
          await updateUser({ teamId: data.teamId });
        }
        Alert.alert("🎉 Thành công", "Bạn đã tham gia đội thành công!");
        // Xoá lời mời khỏi danh sách
        setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));
      } else {
        Alert.alert("Lỗi", data.message || "Không thể chấp nhận lời mời.");
      }
    } catch (err) {
      Alert.alert("Lỗi kết nối", "Không thể kết nối tới server.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (invitationId) => {
    Alert.alert(
      "Từ chối lời mời",
      "Bạn có chắc muốn từ chối lời mời này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Từ chối",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(invitationId);

              const res = await fetch(
                `${API_BASE_URL}/api/invitations/${invitationId}/reject`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${user.token}`,
                  },
                }
              );

              const data = await res.json();

              if (data.success) {
                setInvitations((prev) =>
                  prev.filter((inv) => inv._id !== invitationId)
                );
              } else {
                Alert.alert("Lỗi", data.message);
              }
            } catch (err) {
              Alert.alert("Lỗi kết nối", "Không thể kết nối tới server.");
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isProcessing = processingId === item._id;
    const teamName = item.teamId?.name || "Đội không rõ";
    const teamLocation = item.teamId?.location || "";
    const captainName = item.captainId?.username || "Không rõ";

    return (
      <View style={styles.card}>
        {/* Icon đội */}
        <View style={styles.cardHeader}>
          <View style={styles.teamIconWrap}>
            <Ionicons name="shield" size={28} color="#22c55e" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.teamName}>{teamName}</Text>
            {teamLocation ? (
              <Text style={styles.cardSub}>
                <Ionicons name="location-outline" size={13} color="#64748b" />{" "}
                {teamLocation}
              </Text>
            ) : null}
            <Text style={styles.cardSub}>
              <Ionicons name="person-outline" size={13} color="#64748b" /> Đội
              trưởng: {captainName}
            </Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="mail" size={12} color="#3b82f6" />
            <Text style={styles.badgeText}>Lời mời tham gia đội</Text>
          </View>
        </View>

        {/* Buttons */}
        {isProcessing ? (
          <ActivityIndicator color="#22c55e" style={{ marginTop: 12 }} />
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => handleReject(item._id)}
            >
              <Ionicons name="close" size={16} color="#ef4444" />
              <Text style={styles.rejectText}>Từ chối</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleAccept(item._id)}
            >
              <Ionicons name="checkmark" size={16} color="white" />
              <Text style={styles.acceptText}>Đồng ý</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Thông báo</Text>
          <Text style={styles.headerTitle}>Lời mời vào đội</Text>
        </View>
        <View style={styles.bellWrap}>
          <Ionicons name="notifications" size={22} color="#22c55e" />
          {invitations.length > 0 && (
            <View style={styles.badge2}>
              <Text style={styles.badge2Text}>{invitations.length}</Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : invitations.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="mail-open-outline" size={64} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>Không có lời mời nào</Text>
          <Text style={styles.emptySub}>
            Khi ai đó mời bạn vào đội, lời mời sẽ xuất hiện ở đây.
          </Text>
        </View>
      ) : (
        <FlatList
          data={invitations}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchInvitations();
              }}
              colors={["#22c55e"]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerSub: { fontSize: 13, color: "#64748b", marginBottom: 2 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#0f172a" },
  bellWrap: { position: "relative", padding: 8 },
  badge2: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badge2Text: { color: "white", fontSize: 10, fontWeight: "bold" },

  list: { padding: 16 },

  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },

  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  teamIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#dcfce7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  teamName: { fontSize: 17, fontWeight: "bold", color: "#0f172a", marginBottom: 4 },
  cardSub: { fontSize: 13, color: "#64748b", marginTop: 2 },

  badgeRow: { flexDirection: "row", marginBottom: 14 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  badgeText: { fontSize: 12, color: "#3b82f6", fontWeight: "600" },

  buttonRow: { flexDirection: "row", gap: 10 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#ef4444",
    gap: 6,
  },
  rejectText: { color: "#ef4444", fontWeight: "bold", fontSize: 14 },

  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    gap: 6,
  },
  acceptText: { color: "white", fontWeight: "bold", fontSize: 14 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#334155", marginTop: 16 },
  emptySub: { fontSize: 14, color: "#64748b", textAlign: "center", marginTop: 8, lineHeight: 20 },
});
