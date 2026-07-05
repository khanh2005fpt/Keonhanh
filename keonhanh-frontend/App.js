import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './home/HomeScreen';
import PlayerListScreen from './home/PlayerListScreen';
import CreateMatchScreen from './home/CreateMatchScreen';
import CreateTeamScreen from './home/CreateTeamScreen';
import MyTeamScreen from './home/MyTeamScreen';
import RegisterScreen from "./auth/register";
import LoginScreen from "./auth/login";
import ProfileSetupScreen from "./profile/profile";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext, AuthProvider } from './auth/AuthContext';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {/* app chính */}
          <Stack.Screen name="main" component={MainTabs} />
          {/* màn hình đăng ký */}
          <Stack.Screen name="register" component={RegisterScreen} />
          <Stack.Screen name="login" component={LoginScreen} />
          <Stack.Screen name="profile" component={ProfileSetupScreen} />
          <Stack.Screen name="createMatch" component={CreateMatchScreen} />
          <Stack.Screen name="createTeam" component={CreateTeamScreen} />
          <Stack.Screen name="myTeam" component={MyTeamScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

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



      </Tab.Navigator>
    );
  }
