import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ======================
  // LOAD USER FROM STORAGE
  // ======================
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);

          // 🔥 đảm bảo luôn có token field
          setUser(parsedUser);
        }
      } catch (error) {
        console.log("LOAD USER ERROR:", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // ======================
  // LOGIN
  // ======================
  const login = async (response) => {
    try {
      /**
       * EXPECT RESPONSE FROM BACKEND:
       * {
       *   user: {...},
       *   token: "jwt..."
       * }
       */

      const userData = {
        ...response.user,
        token: response.token, // 🔥 BẮT BUỘC
      };

      setUser(userData);

      await AsyncStorage.setItem("user", JSON.stringify(userData));
    } catch (error) {
      console.log("LOGIN ERROR:", error.message);
    }
  };

  // ======================
  // LOGOUT
  // ======================
  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem("user");
    } catch (error) {
      console.log("LOGOUT ERROR:", error.message);
    }
  };

  // ======================
  // CONTEXT VALUE
  // ======================
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};