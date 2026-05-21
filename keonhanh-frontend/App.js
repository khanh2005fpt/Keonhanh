import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import RegisterScreen from "./auth/register";
import ProfileSetupScreen from "./profile/profile";
import { API_BASE_URL } from "./config/api";

export default function App() {
  const [registeredUser, setRegisteredUser] = useState(null);
  const [savedProfile, setSavedProfile] = useState(null);

  if (!registeredUser) {
    return (
      <>
        <RegisterScreen
          apiBaseUrl={API_BASE_URL}
          onRegistered={setRegisteredUser}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  if (!savedProfile) {
    return (
      <>
        <ProfileSetupScreen
          apiBaseUrl={API_BASE_URL}
          onCompleted={setSavedProfile}
          user={registeredUser}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.doneBox}>
        <Text style={styles.doneKicker}>Hoàn tất</Text>
        <Text style={styles.doneTitle}>Profile đã sẵn sàng</Text>
        <Text style={styles.doneText}>
          {savedProfile.fullName} - {savedProfile.position} -{" "}
          {savedProfile.location}
        </Text>
        <Pressable
          onPress={() => {
            setRegisteredUser(null);
            setSavedProfile(null);
          }}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Đăng ký tài khoản khác</Text>
        </Pressable>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f8f4",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  doneBox: {
    backgroundColor: "#ffffff",
    borderColor: "#dfe7df",
    borderRadius: 8,
    borderWidth: 1,
    padding: 20,
  },
  doneKicker: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
  },
  doneTitle: {
    color: "#17201a",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10,
  },
  doneText: {
    color: "#5d6b63",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
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
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});
