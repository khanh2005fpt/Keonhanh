import { useState, useContext } from "react";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "./AuthContext";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { API_BASE_URL } from "../config/api";
export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();
  const { login } = useContext(AuthContext);
  const handleLogin = async () => {
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    let res, data;
    try {
      res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });
      data = await res.json();
        console.log("========== LOGIN RESPONSE ==========");
        console.log("DATA =", data);
        console.log("USER =", data.user);
        console.log("PROFILE =", data.profile);
        console.log("PROFILE ID =", data.profile?._id);
        console.log("TEAM =", data.team);
    } catch (networkError) {
      setError("Không thể kết nối tới server. Kiểm tra lại mạng!");
      setIsSubmitting(false);
      return;
    }

    if (!res.ok) {
      setError(data.message || "Đăng nhập thất bại");
      setIsSubmitting(false);
      return;
    }

    // Lưu thông tin người dùng vào global state
    await login({
      ...data.user,
      profileId: data.profile?._id || null,
      profile: data.profile || null,
      team: data.team || null,
    });

    // Đăng nhập thành công, điều hướng về màn hình chính
    navigation.navigate("main");
    setIsSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.screen}
    >
      <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← Quay lại</Text>
      </Pressable>
      <View style={styles.header}>
        <Text style={styles.logo}>KeoNhanh</Text>
        <Text style={styles.title}>Chào mừng</Text>
        <Text style={styles.subtitle}>
          Đăng nhập để tiếp tục tìm kèo bóng đá.
        </Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setUsername}
          placeholder="vd: messi10"
          placeholderTextColor="#8b98a5"
          style={styles.input}
          value={username}
        />
        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput
          onChangeText={setPassword}
          placeholder="Tối thiểu 6 ký tự"
          placeholderTextColor="#8b98a5"
          secureTextEntry
          style={styles.input}
          value={password}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          disabled={isSubmitting}
          onPress={handleLogin}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isSubmitting && styles.buttonDisabled,
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Đăng nhập</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    marginBottom: 12,
  },

  backText: {
    color: "#22c55e",
    fontSize: 15,
    fontWeight: "700",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f6f8f4",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  header: {
    marginBottom: 28,
  },
  logo: {
    color: "#22c55e",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 14,
  },
  title: {
    color: "#17201a",
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    color: "#5d6b63",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  form: {
    backgroundColor: "#ffffff",
    borderColor: "#dfe7df",
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  label: {
    color: "#2f3b33",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9fbf8",
    borderColor: "#d7e1d8",
    borderRadius: 8,
    borderWidth: 1,
    color: "#17201a",
    fontSize: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
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
    minHeight: 50,
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
