module.exports = ({ config }) => {
  // Khi chạy npm run start hoặc npx expo start, Expo sẽ ở chế độ development.
  // Chúng ta sẽ ẩn projectId và cấu hình updates đi để không bị khóa tài khoản khi quét mã QR nội bộ.
  if (process.env.NODE_ENV === 'development') {
    if (config.extra && config.extra.eas) {
      delete config.extra.eas.projectId;
    }
    delete config.updates;
    delete config.runtimeVersion;
  }
  
  return config;
};
