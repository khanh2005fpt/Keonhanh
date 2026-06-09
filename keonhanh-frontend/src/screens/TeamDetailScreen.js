import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export default function TeamDetailScreen({ route }) {
  const { team } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {team.name}
        </Text>

        <Text style={styles.label}>
          Khu vực
        </Text>

        <Text style={styles.value}>
          {team.location}
        </Text>

        <Text style={styles.label}>
          ID đội
        </Text>

        <Text style={styles.value}>
          {team._id}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
    padding: 16,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },

  label: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
  },

  value: {
    fontSize: 18,
    color: '#555',
    marginTop: 4,
  },
});