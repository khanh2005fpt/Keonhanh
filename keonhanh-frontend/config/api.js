import { Platform } from "react-native";

// CHÚ Ý: Đổi dòng này thành IP Wifi máy tính của bạn nếu bạn chạy trên ĐIỆN THOẠI THẬT.
// Nếu bạn chỉ chạy trên máy ảo Android Studio thì không cần quan tâm biến này.
const LOCAL_IP = "192.168.1.5";

const getBaseURL = () => {
  // ÉP BUỘC dùng 10.0.2.2 cho máy ảo Android (Bắt buộc để kết nối Backend trên máy tính)
  if (Platform.OS === "android") {
    return "http://10.0.2.2:9999";
  }

  // Ép dùng localhost cho máy ảo iOS (iPhone)
  if (Platform.OS === "ios") {
    return "http://localhost:9999";
  }

  // Dùng IP cho thiết bị thật
  return `http://${LOCAL_IP}:9999`;
};

export const API_BASE_URL = getBaseURL();
