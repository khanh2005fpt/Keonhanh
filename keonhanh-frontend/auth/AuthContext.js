import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);         // USERS table
  const [profile, setProfile] = useState(null);   // USER_PROFILES table
  const [loading, setLoading] = useState(true);

  // ======================
  // LOAD FROM STORAGE
  // ======================
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const storedProfile = await AsyncStorage.getItem("profile");
        const storedToken = await AsyncStorage.getItem("token");

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }

        // attach token vào user nếu cần
        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            ...parsedUser,
            token: storedToken,
          });
        }
      } catch (error) {
        console.log("LOAD AUTH ERROR:", error.message);
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, []);

  // ======================
  // LOGIN
  // EXPECT:
  // {
  //   user: {...Users},
  //   profile: {...User_profiles},
  //   token: "jwt"
  // }
  // ======================
  const login = async (response) => {
    try {
     // console.log("LOGIN INPUT =", response);

      const user = response.user;
      const profile = response.profile;
      const token = response.token;

      if (!token) {
        throw new Error("Missing token");
      }

      const userData = {
        ...(user || {}),
        token,
      };

      setUser(userData);
      setProfile(profile || null);

      await AsyncStorage.setItem("user", JSON.stringify(userData));
      await AsyncStorage.setItem("token", token);

      if (profile) {
        await AsyncStorage.setItem("profile", JSON.stringify(profile));
      }

    } catch (error) {
      console.log("LOGIN ERROR:", error.message);
    }
  };

  // ======================
  // UPDATE USER (dùng sau khi tạo đội, v.v.)
  // ======================
  const updateUser = async (newFields) => {
    try {
      const updatedUser = { ...user, ...newFields };
      setUser(updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.log("UPDATE USER ERROR:", error.message);
    }
  };

  // ======================
  // LOGOUT
  // ======================
  const logout = async () => {
    try {
      setUser(null);
      setProfile(null);

      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("profile");
      await AsyncStorage.removeItem("token");
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
        profile,
        loading,
        login,
        logout,
        updateUser,

        // helpers
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};