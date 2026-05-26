import { useState, useEffect } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { API_BASE_URL } from "../config/api";

const POSITIONS = ["Thủ môn", "Hậu vệ", "Tiền vệ", "Tiền đạo"];

export default function ProfileSetupScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [form, setForm] = useState({
    avatar: "",
    fullName: "",
    phone: "",
    position: POSITIONS[0], 
    location: "",
    isLookingForTeam: true,
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userId = route.params?.userId;
  const username = route.params?.username;

  const updateField = (field, value) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      if (!userId) {
        throw new Error("Khong tim thay thong tin user");
      }

      const response = await fetch(`${API_BASE_URL}/api/user-profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...form,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Luu profile that bai");
      }

      navigation.navigate("main");
    } catch (profileError) {
      setError(profileError.message || "Khong the ket noi toi server");
    } finally {
      setIsSubmitting(false);
    }
  };
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      });
  }, []);
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Xin chào, {username}</Text>
          <Text style={styles.title}>Setup profile</Text>
        </View>

        <View style={styles.avatarRow}>
          <View style={styles.avatarPreview}>
            {form.avatar ? (
              <Image source={{ uri: form.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {username.slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.avatarInputWrap}>
            <Text style={styles.label}>Ảnh avatar</Text>
            <TextInput
              autoCapitalize="none"
              onChangeText={(value) => updateField("avatar", value)}
              placeholder="Dán link ảnh avatar"
              placeholderTextColor="#8b98a5"
              style={styles.input}
              value={form.avatar}
            />
          </View>
        </View>

        <Text style={styles.label}>Họ tên</Text>
        <TextInput
          onChangeText={(value) => updateField("fullName", value)}
          placeholder="Nguyễn Văn A"
          placeholderTextColor="#8b98a5"
          style={styles.input}
          value={form.fullName}
        />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          keyboardType="phone-pad"
          onChangeText={(value) => updateField("phone", value)}
          placeholder="09xx xxx xxx"
          placeholderTextColor="#8b98a5"
          style={styles.input}
          value={form.phone}
        />

        <Text style={styles.label}>Vị trí trên sân</Text>
        <View style={styles.positionGrid}>
          {POSITIONS.map((position) => {
            const isSelected = form.position === position;

            return (
              <Pressable
                key={position}
                onPress={() => updateField("position", position)}
                style={[
                  styles.positionButton,
                  isSelected && styles.positionButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.positionText,
                    isSelected && styles.positionTextSelected,
                  ]}
                >
                  {position}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Địa chỉ / khu vực</Text>
        <TextInput
          onChangeText={(value) => updateField("location", value)}
          placeholder="vd: Quận 7, TP.HCM"
          placeholderTextColor="#8b98a5"
          style={styles.input}
          value={form.location}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={isSubmitting}
          onPress={handleSaveProfile}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isSubmitting && styles.buttonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Lưu profile</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f8f4",
  },
  content: {
    padding: 22,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 22,
    paddingTop: 18,
  },
  kicker: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  title: {
    color: "#17201a",
    fontSize: 30,
    fontWeight: "800",
  },
  avatarRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#dfe7df",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 18,
    padding: 14,
  },
  avatarPreview: {
    alignItems: "center",
    backgroundColor: "#e7f2e5",
    borderRadius: 36,
    height: 72,
    justifyContent: "center",
    overflow: "hidden",
    width: 72,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
  },
  avatarText: {
    color: "#22c55e",
    fontSize: 21,
    fontWeight: "900",
  },
  avatarInputWrap: {
    flex: 1,
  },
  label: {
    color: "#2f3b33",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d7e1d8",
    borderRadius: 8,
    borderWidth: 1,
    color: "#17201a",
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  positionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  positionButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#d7e1d8",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    width: "47%",
  },
  positionButtonSelected: {
    backgroundColor: "#22c55e",
    borderColor: "#22c55e",
  },
  positionText: {
    color: "#2f3b33",
    fontSize: 15,
    fontWeight: "700",
  },
  positionTextSelected: {
    color: "#ffffff",
  },
  error: {
    color: "#b3261e",
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#22c55e",
    borderRadius: 8,
    minHeight: 52,
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.86,
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});
