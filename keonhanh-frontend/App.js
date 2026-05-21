import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './home/HomeScreen';
import PlayerListScreen from './home/PlayerListScreen';
// import TeamScreen from './home/TeamScreen';
// import MatchScreen from './home/MatchScreen';
// import ProfileScreen from './home/ProfileScreen';

const Tab = createBottomTabNavigator();
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
          onCompleted={(profile) => {
            setSavedProfile(profile); // 👈 quan trọng nhất
          }}
          user={registeredUser}
        />
        <StatusBar style="dark" />
      </>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#22c55e',
          tabBarInactiveTintColor: '#888',
          tabBarStyle: {
            height: 70,
            paddingBottom: 8,
            paddingTop: 8,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          },

          tabBarIcon: ({ color, size, focused }) => {
            let iconName;

            if (route.name === 'Trang chủ') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Cầu thủ') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === 'Đội bóng') {
              iconName = focused ? 'shield' : 'shield-outline';
            } else if (route.name === 'Kèo đấu') {
              iconName = focused ? 'football' : 'football-outline';
            } else if (route.name === 'Cá nhân') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return (
              <Ionicons
                name={iconName}
                size={size}
                color={color}
              />
            );
          },
        })}
      >
        <Tab.Screen
          name="Trang chủ"
          component={HomeScreen}
        />

        <Tab.Screen
          name="Cầu thủ"
          component={PlayerListScreen}
        />
        {/* 
        <Tab.Screen
          name="Đội bóng"
       //   component={TeamScreen}
        />

        <Tab.Screen
          name="Kèo đấu"
      //    component={MatchScreen}
        />

        <Tab.Screen
          name="Cá nhân"
      //    component={ProfileScreen}
        /> */}
      </Tab.Navigator>


    </NavigationContainer>
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
