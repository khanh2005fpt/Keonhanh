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
  ScrollView,
} from "react-native";

import { API_BASE_URL } from "../config/api";

export default function RegisterScreen() {
  const { login } = useContext(AuthContext);
  const navigation = useNavigation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    if (!username.trim()) {
      setError("Vui lòng nhập username");
      return false;
    }

    if (username.trim().length < 3) {
      setError("Username phải có ít nhất 3 ký tự");
      return false;
    }

    if (!password) {
      setError("Vui lòng nhập mật khẩu");
      return false;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (isSubmitting) return;

    if (!validate()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Đăng ký thất bại");
      }

      await login(data.user);

      // reset form
      setUsername("");
      setPassword("");

      // chuyển sang tạo profile
      navigation.replace("profile", {
        userId: data.user._id,
        username: data.user.username,
      });

    } catch (err) {
      setError(err.message || "Không thể kết nối tới server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Quay lại</Text>
        </Pressable>
        <View style={styles.header}>
          <Text style={styles.logo}>KeoNhanh</Text>
          <Text style={styles.title}>Đăng ký tài khoản</Text>
          <Text style={styles.subtitle}>
            Tạo tài khoản để bắt đầu tìm kèo bóng đá.
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
            onPress={handleRegister}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Tạo tài khoản</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
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
    backgroundColor: "#fff",
    borderColor: "#dfe7df",
    borderWidth: 1,
    borderRadius: 8,
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
    borderWidth: 1,
    borderRadius: 8,
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
    backgroundColor: "#22c55e",
    minHeight: 50,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
});