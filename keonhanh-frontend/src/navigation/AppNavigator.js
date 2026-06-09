import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TeamListScreen from '../screens/TeamListScreen';
import CreateTeamScreen from '../screens/CreateTeamScreen';
import TeamDetailScreen from '../screens/TeamDetailScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Danh sách đội">
          {(props) => <TeamListScreen {...props} />}
        </Stack.Screen>

        <Stack.Screen name="Tạo đội">
          {(props) => <CreateTeamScreen {...props} />}
        </Stack.Screen>

        <Stack.Screen name="Chi tiết đội">
          {(props) => <TeamDetailScreen {...props} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}