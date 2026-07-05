import { useState, useEffect, useContext } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AuthContext } from "../auth/AuthContext";
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
  const { logout } = useContext(AuthContext);

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
    setError(""); // Xóa thông báo lỗi khi người dùng bắt đầu nhập lại
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

    // 1. Chuẩn hóa dữ liệu (trim khoảng trắng)
    const fullName = form.fullName.trim();
    const phone = form.phone.trim();
    const location = form.location.trim();

    // 2. Định nghĩa các Regex kiểm tra
    // Hỗ trợ tiếng Việt, yêu cầu ít nhất 2 từ (họ và tên tách nhau bằng khoảng trắng)
    const nameRegex =
      /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠưăâêôơ]+(\s+[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠưăâêôơ]+)+$/;
    const phoneRegex = /^(0|84|\+84)(3|5|7|8|9)([0-9]{8})$/;

    // 3. Tiến hành validation
    if (!fullName) {
      setError("Vui lòng nhập họ và tên.");
      return;
    }
    if (fullName.length < 4 || fullName.length > 50) {
      setError("Họ tên phải từ 4 đến 50 ký tự.");
      return;
    }
    if (!nameRegex.test(fullName)) {
      setError(
        "Vui lòng nhập đầy đủ cả họ và tên (tối thiểu 2 từ, ví dụ: Nguyễn Văn A).",
      );
      return;
    }

    if (!phone) {
      setError("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!phoneRegex.test(phone)) {
      setError("Số điện thoại không đúng định dạng (Ví dụ: 0912345678).");
      return;
    }

    if (!location) {
      setError("Vui lòng nhập địa chỉ / khu vực.");
      return;
    }
    if (location.length < 5) {
      setError(
        "Địa chỉ quá ngắn. Vui lòng nhập chi tiết hơn (tối thiểu 5 ký tự).",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      if (!userId) {
        throw new Error("Không tìm thấy thông tin user");
      }

      const response = await fetch(`${API_BASE_URL}/api/user-profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...form,
          fullName, // Gửi các giá trị đã được trim chuẩn hóa
          phone,
          location,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Lưu profile thất bại");
      }

      navigation.navigate("main");
    } catch (profileError) {
      setError(profileError.message || "Không thể kết nối tới server");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.navigate("main");
  };

  useEffect(() => {
    if (!userId) return;

    fetch(`${API_BASE_URL}/api/user-profiles/${userId}`)
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.profile) {
          const p = data.profile;
          setForm({
            avatar: p.avatar || "",
            fullName: p.fullName || "",
            phone: p.phone || "",
            position: p.position || POSITIONS[0],
            location: p.location || "",
            isLookingForTeam:
              p.isLookingForTeam !== undefined ? p.isLookingForTeam : true,
          });
        }
      })
      .catch((err) => {
        console.log("Failed to load profile:", err);
      });
  }, [userId]);
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
                {username ? username.slice(0, 2).toUpperCase() : "U"}
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

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
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
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#ef4444",
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 52,
    justifyContent: "center",
    marginTop: 12,
  },
  logoutButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "800",
  },
});
