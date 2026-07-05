import React, { useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config/api";
import { Image as RNImage } from 'react-native';

export default function PlayerListScreen() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchPlayers();
    }, [])
  );

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
      console.log("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderPlayerCard = ({ item }) => (
    <View style={styles.playerCard}>
      <View style={styles.playerHeader}>
        <Image
          source={{
            uri:
              (item.avatar && (item.avatar.startsWith('http') || item.avatar.startsWith('data:image')))
                ? item.avatar
                : "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.avatarImage}
        />
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{item.fullName}</Text>
          <Text style={styles.playerDetail}>⚽ {item.position}</Text>

          <Text style={styles.playerDetail}>
            📍 {item.location}
          </Text>
          <Text style={styles.playerDetail}>
            📞 {item.phone || 'Không có thông tin'}
          </Text>
        </View>
      </View>
      {/* 
      <View style={styles.playerStats}>
        <View style={styles.statDivider} />
      </View> */}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.inviteButton}>
          <Ionicons name="mail-outline" size={16} color="white" />
          <Text style={styles.inviteButtonText}>Mời Đá</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, zIndex: 2 }}>
            <Text style={styles.hello}>Tìm Đồng Đội 👥</Text>
            <Text style={styles.title}>Danh sách cầu thủ</Text>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={24} color="white" />
          </TouchableOpacity>
        </View>


        {/* Player List */}

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

        {/* Bottom Spacing */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },

  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#22c55e',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  hello: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: 'white',
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

  // Search Container
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  searchPlaceholder: {
    marginLeft: 12,
    color: "#999",
    fontSize: 15,
  },


  filterContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 10,
  },

  // Section Title
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    marginHorizontal: 16,
  },

  // Player Card Styles
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

  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#22c55e",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  avatarInitial: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
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

  // Player Stats
  playerStats: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 14,
  },

  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  statText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 12,
  },

  // Invite Button
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

  // Loading & Empty States
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

  // Separator
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 16,
  },

  detailButton: {
    backgroundColor: "#3b82f6",
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  detailButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 14,
  },
});
