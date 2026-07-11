// import { Platform } from "react-native";

// // CHÚ Ý: Đổi dòng này thành IP Wifi máy tính của bạn nếu bạn chạy trên ĐIỆN THOẠI THẬT.
// // Nếu bạn chỉ chạy trên máy ảo Android Studio thì không cần quan tâm biến này.
// const LOCAL_IP = "192.168.1.5";

// const getBaseURL = () => {
//   // ÉP BUỘC dùng 10.0.2.2 cho máy ảo Android (Bắt buộc để kết nối Backend trên máy tính)
//   if (Platform.OS === "android") {
//     return "http://10.0.2.2:9999";
//   }

//   // Ép dùng localhost cho máy ảo iOS (iPhone)
//   if (Platform.OS === "ios") {
//     return "http://localhost:9999";
//   }

//   // Dùng IP cho thiết bị thật
//   return `http://${LOCAL_IP}:9999`;
// };

// export const API_BASE_URL = getBaseURL();

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
