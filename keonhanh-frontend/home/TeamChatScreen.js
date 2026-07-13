import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api';
import { AuthContext } from '../auth/AuthContext';

export default function TeamChatScreen({ route, navigation }) {
  const { teamId, teamName } = route.params;
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    // 1. Fetch tin nhắn cũ
    const fetchOldMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/messages/${teamId}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          }
        });
        
        const text = await res.text(); // Đọc raw text trước
        try {
          const data = JSON.parse(text);
          if (res.ok) {
            setMessages(data);
          } else {
            console.error("Server trả về lỗi:", data);
          }
        } catch (parseErr) {
          console.error("Không thể parse JSON. Server trả về:", text);
        }
      } catch (err) {
        console.error("Lỗi fetch message", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOldMessages();

    // 2. Kết nối socket
    socketRef.current = io(API_BASE_URL);
    
    socketRef.current.on('connect', () => {
      socketRef.current.emit('joinTeam', teamId);
    });

    socketRef.current.on('receiveMessage', (newMessage) => {
      setMessages(prev => [...prev, newMessage]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [teamId]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    socketRef.current.emit('sendMessage', {
      teamId: teamId,
      senderId: user.id || user._id,
      content: inputText.trim(),
    });

    setInputText("");
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender?._id === (user.id || user._id);
    return (
      <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
        {!isMe && <Text style={styles.senderName}>{item.sender?.fullName || item.sender?.username || "Ẩn danh"}</Text>}
        <Text style={[styles.messageText, isMe ? styles.myText : styles.otherText]}>{item.content}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{teamName}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <ActivityIndicator style={{ flex: 1 }} size="large" color="#16a34a" />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item, index) => item._id || index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.chatContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4fdf4' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#16a34a', padding: 16,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    elevation: 4,
  },
  backBtn: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  chatContainer: { padding: 16 },
  messageBubble: {
    maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12,
  },
  myBubble: {
    alignSelf: 'flex-end', backgroundColor: '#16a34a',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    alignSelf: 'flex-start', backgroundColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
  },
  senderName: { fontSize: 12, color: '#475569', marginBottom: 4, fontWeight: 'bold' },
  messageText: { fontSize: 15 },
  myText: { color: 'white' },
  otherText: { color: '#1e293b' },
  inputContainer: {
    flexDirection: 'row', padding: 12, backgroundColor: 'white',
    alignItems: 'center', borderTopWidth: 1, borderColor: '#e2e8f0',
  },
  input: {
    flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, marginRight: 12,
    fontSize: 15,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center',
  }
});
