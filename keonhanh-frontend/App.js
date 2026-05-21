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

export default function App() {
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