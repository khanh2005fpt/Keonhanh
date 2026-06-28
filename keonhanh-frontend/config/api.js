import { Platform } from "react-native";
import Constants from "expo-constants";

let API_HOST = "localhost";

// Nếu chạy qua Expo Go, lấy IP trực tiếp từ máy chủ đang chạy app
const debuggerHost = Constants.expoConfig?.hostUri;

if (debuggerHost) {
  // hostUri thường có dạng "192.168.x.x:8081", ta chỉ lấy phần IP
  API_HOST = debuggerHost.split(":")[0];
} else if (Platform.OS === "android") {
  // Fallback cho máy ảo Android nếu không chạy qua Expo Go
  API_HOST = "10.0.2.2";
}

export const API_BASE_URL = `http://${API_HOST}:9999`;
