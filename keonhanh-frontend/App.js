import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './home/HomeScreen';
import PlayerListScreen from './home/PlayerListScreen';
import CreateMatchScreen from './home/CreateMatchScreen';
import CreateTeamScreen from './home/CreateTeamScreen';
import MyTeamScreen from './home/MyTeamScreen';
import FindTeamScreen from './home/FindTeamScreen';
import TeamChatScreen from './home/TeamChatScreen';
// import TeamScreen from './home/TeamScreen';
import MatchScreen from './home/MatchScreen';
// import ProfileScreen from './home/ProfileScreen';
import MatchDetailScreen from './home/MatchDetailScreen';
import AllMatchesScreen from './home/AllMatchesScreen';

import RegisterScreen from "./auth/register";
import LoginScreen from "./auth/login";
import ProfileSetupScreen from "./profile/profile";

import { AuthContext, AuthProvider } from './auth/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>

        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

// =======================
// ROOT NAVIGATOR (FIX AUTH)
// =======================
function RootNavigator() {
  const { user, loading } = useContext(AuthContext);

  // 🔥 CHẶN LOAD TRƯỚC KHI RESTORE AUTH
  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* APP CHÍNH */}
      <Stack.Screen name="main" component={MainTabs} />

      {/* AUTH */}
      {!user && (
        <>
          <Stack.Screen name="register" component={RegisterScreen} />
          <Stack.Screen name="login" component={LoginScreen} />
        </>
      )}

      {/* EXTRA SCREENS */}
      <Stack.Screen name="profile" component={ProfileSetupScreen} />
      <Stack.Screen name="createMatch" component={CreateMatchScreen} />
      <Stack.Screen name="matchDetail" component={MatchDetailScreen} />
      <Stack.Screen name="createTeam" component={CreateTeamScreen} />
      <Stack.Screen name="myTeam" component={MyTeamScreen} />
      <Stack.Screen name="allMatches" component={AllMatchesScreen} />
      <Stack.Screen name="findTeam" component={FindTeamScreen} />
      <Stack.Screen name="teamChat" component={TeamChatScreen} />
    </Stack.Navigator>
  );
}

// =======================
// TAB NAVIGATOR
// =======================
function MainTabs() {
  const { user } = useContext(AuthContext);

  return (
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
          } else if (route.name === 'Đội của tôi') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
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

      {user && (
        <Tab.Screen
          name="Đội của tôi"
          component={MyTeamScreen}
        />
      )}
      {user && (
        <Tab.Screen
          name="Kèo đấu"
          component={MatchScreen}
        />
      )}
      {/* 
        <Tab.Screen
          name="Đội bóng"
       //   component={TeamScreen}
        />

      

        <Tab.Screen
          name="Cá nhân"
      //    component={ProfileScreen}
        /> */}

    </Tab.Navigator>
  );
}
