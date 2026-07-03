import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { socketUrl, getFileUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { 
  Send, MessageSquare, Phone, Video, Loader2, Image, Heart, 
  Smile, ThumbsUp, Plus, MoreVertical, Check, CheckCheck, Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import CallModal from '../components/CallModal';

export default function Chat() {
  const { user: currentUser } = useAuth();
  
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(null); // messageId
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Call States
  const [callActive, setCallActive] = useState(false);
  const [callInfo, setCallInfo] = useState(null);

  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedUserRef = useRef(null);

  // Sync ref with selected user to avoid stale closures in socket listener
  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  // Fetch contact list
  const { data: contactsData, isLoading: loadingContacts } = useQuery({
    queryKey: ['chatContacts'],
    queryFn: async () => {
      const res = await api.get('/api/social/users');
      return res.data.users;
    },
  });

  // Query/Effect: Fetch initial unread counts
  useEffect(() => {
    const fetchUnreadCounts = async () => {
      try {
        const res = await api.get('/api/messages/unread/counts');
        if (res.data.success) {
          setUnreadCounts(res.data.counts || {});
        }
      } catch (err) {
        console.error('Failed to load unread message counts:', err);
      }
    };
    if (currentUser) {
      fetchUnreadCounts();
    }
  }, [currentUser]);

  // Effect: Mark messages as read when selecting a contact
  useEffect(() => {
    if (!selectedUser) return;

    const markMessagesRead = async () => {
      try {
        await api.put(`/api/messages/${selectedUser._id}/read`);
        setUnreadCounts((prev) => ({
          ...prev,
          [selectedUser._id]: 0,
        }));
      } catch (err) {
        console.error('Failed to mark messages as read:', err);
      }
    };

    markMessagesRead();
    setIsPeerTyping(false);
  }, [selectedUser]);

  // Socket setup
  useEffect(() => {
    if (!currentUser) return;

    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('register-user', currentUser._id);
    });

    newSocket.on('online-users', (userIds) => {
      setOnlineUsers(userIds);
    });

    newSocket.on('receive-message', (msg) => {
      const senderId = String(msg.sender?._id || msg.sender);
      const activePartner = selectedUserRef.current;
      
      // Update last messages preview state
      setLastMessages((prev) => ({
        ...prev,
        [senderId]: {
          content: msg.messageType === 'image' ? 'Sent an image 📷' : msg.content,
          createdAt: msg.createdAt,
        }
      }));

      // If message is from the active chat partner, append to list
      if (activePartner && String(activePartner._id) === senderId) {
        setMessages((prev) => [...prev, msg]);
        api.put(`/api/messages/${senderId}/read`).catch(() => {});
      } else {
        // Increment unread count for sender
        if (senderId !== String(currentUser._id)) {
          setUnreadCounts((prev) => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1,
          }));
          toast(`New message from contact`, { icon: '💬' });
        } else {
          // If we sent a message from another tab, append it
          if (activePartner && String(activePartner._id) === String(msg.recipient?._id || msg.recipient)) {
            setMessages((prev) => [...prev, msg]);
          }
        }
      }
    });

    // Listening for typing indicator from peer
    newSocket.on('incoming-typing', ({ senderId, isTyping }) => {
      const activePartner = selectedUserRef.current;
      if (activePartner && String(activePartner._id) === String(senderId)) {
        setIsPeerTyping(isTyping);
      }
    });

    // Listening for reaction updates
    newSocket.on('message-reaction-updated', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (String(m._id) === String(messageId) ? { ...m, reactions } : m))
      );
    });

    // Handle Incoming Call signals
    newSocket.on('incoming-call', ({ callerId, callerName, signalData, type }) => {
      setCallInfo({
        callerId,
        callerName,
        recipientId: currentUser._id,
        type,
        signalData,
        direction: 'inbound',
      });
      setCallActive(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Fetch message history when active chat partner changes
  useEffect(() => {
    if (!selectedUser) return;

    const fetchHistory = async () => {
      try {
        const res = await api.get(`/api/messages/${selectedUser._id}`);
        setMessages(res.data.messages);

        // Seed last message for this partner if messages exist
        const history = res.data.messages;
        if (history.length > 0) {
          const lastMsg = history[history.length - 1];
          setLastMessages((prev) => ({
            ...prev,
            [selectedUser._id]: {
              content: lastMsg.messageType === 'image' ? 'Sent an image 📷' : lastMsg.content,
              createdAt: lastMsg.createdAt,
            }
          }));
        }
      } catch (err) {
        toast.error('Failed to load message history');
      }
    };
    fetchHistory();
  }, [selectedUser]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPeerTyping]);

  // Input Typing change
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (socket && selectedUser) {
      socket.emit('typing', {
        senderId: currentUser._id,
        recipientId: selectedUser._id,
        isTyping: e.target.value.trim().length > 0,
      });
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !selectedUser) return;

    socket.emit('send-message', {
      senderId: currentUser._id,
      recipientId: selectedUser._id,
      content: newMessage.trim(),
      messageType: 'text',
    });

    // Turn off typing indicator
    socket.emit('typing', {
      senderId: currentUser._id,
      recipientId: selectedUser._id,
      isTyping: false,
    });

    setNewMessage('');
  };

  // Image Upload handler
  const handleImageSend = async (e) => {
    const file = e.target.files[0];
    if (!file || !socket || !selectedUser) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingImage(true);
    try {
      const res = await api.post('/api/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        socket.emit('send-message', {
          senderId: currentUser._id,
          recipientId: selectedUser._id,
          content: 'Sent an image 📷',
          messageType: 'image',
          fileUrl: res.data.fileUrl,
        });
      }
    } catch (err) {
      toast.error('Image attachment failed. Supported format: JPG, PNG.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Message Reaction handler (Double Tap or Picker Selection)
  const handleReaction = (messageId, emoji) => {
    if (!socket) return;
    socket.emit('react-message', {
      messageId,
      userId: currentUser._id,
      emoji,
    });
    setShowReactionPicker(null);
  };

  const startCall = (callType) => {
    if (!selectedUser) return;
    setCallInfo({
      callerId: currentUser._id,
      callerName: currentUser.name,
      recipientId: selectedUser._id,
      type: callType,
      direction: 'outbound',
    });
    setCallActive(true);
  };

  const isOnline = (userId) => onlineUsers.includes(userId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[88vh] flex flex-col relative z-10">
      <div className="absolute top-[10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-900/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 glass-panel rounded-3xl border-purple-950/40 shadow-2xl overflow-hidden bg-[#0c0a13]/80">
        
        {/* ========================================== */}
        {/* SIDEBAR: CONVERSATIONS (4 columns)         */}
        {/* ========================================== */}
        <div className="md:col-span-4 border-r border-purple-950/45 flex flex-col h-full bg-[#08070d]/70">
          <div className="p-5 border-b border-purple-950/30 flex items-center justify-between">
            <div>
              <h2 className="font-accent text-lg font-bold text-white tracking-wide">Direct</h2>
              <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest">Messages Lobby</span>
            </div>
            <span className="text-xs text-gray-500 font-medium">@{currentUser?.name.toLowerCase().replace(/\s/g, '')}</span>
          </div>

          {/* Search Contacts Bar */}
          <div className="px-4 py-2 border-b border-purple-950/20">
            <div className="bg-[#050409] border border-purple-950/80 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <span className="text-gray-600 text-xs">Search:</span>
              <input
                type="text"
                placeholder="Search direct threads..."
                className="bg-transparent text-xs text-gray-300 placeholder:text-gray-700 w-full focus:outline-none"
                disabled
              />
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {loadingContacts ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              </div>
            ) : contactsData?.length === 0 ? (
              <div className="text-center text-xs text-gray-600 py-12">No threads initialized.</div>
            ) : (
              contactsData?.map((contact) => {
                const unreadCount = unreadCounts[contact._id] || 0;
                const lastMsg = lastMessages[contact._id];
                const active = selectedUser?._id === contact._id;

                return (
                  <button
                    key={contact._id}
                    onClick={() => setSelectedUser(contact)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                      active
                        ? 'bg-[#1a1727]/60 border border-purple-900/40 text-white'
                        : 'hover:bg-purple-950/15 border border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {/* Avatar with dynamic live status badge */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 bg-gradient-to-tr from-accent to-purple-900 rounded-full flex items-center justify-center font-bold text-white shadow-md border border-purple-950">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      {isOnline(contact._id) && (
                        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-indian-emerald rounded-full border-2 border-[#0c0a13] animate-pulse"></span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-gray-200 truncate">{contact.name}</h4>
                        {lastMsg && (
                          <span className="text-[9px] text-gray-600 font-mono">
                            {new Date(lastMsg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-[10px] truncate max-w-[150px] ${unreadCount > 0 ? 'text-white font-bold' : 'text-gray-500'}`}>
                          {lastMsg ? lastMsg.content : 'No messages yet'}
                        </p>
                        
                        {unreadCount > 0 && (
                          <span className="bg-accent text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0 animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* MAIN PANEL: CONVERSATION STREAM (8 columns) */}
        {/* ========================================== */}
        <div className="md:col-span-8 flex flex-col h-full bg-[#0a0811]/40 relative">
          {selectedUser ? (
            <>
              {/* Header Details */}
              <div className="p-4 border-b border-purple-950/45 flex items-center justify-between bg-[#08070d]/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-950 rounded-full flex items-center justify-center font-bold text-sm text-purple-300 border border-purple-900/40">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white leading-tight">{selectedUser.name}</h3>
                    <span className="text-[9px] text-gray-500 font-medium">
                      {isOnline(selectedUser._id) ? (
                        <span className="text-indian-emerald font-bold">● Active now</span>
                      ) : (
                        'Active offline'
                      )}
                    </span>
                  </div>
                </div>

                {/* Call buttons triggers */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startCall('audio')}
                    className="p-2.5 rounded-full bg-purple-950/20 border border-purple-900/30 text-purple-400 hover:text-white hover:bg-purple-900/40 transition-all"
                    title="Start Audio Call"
                  >
                    <Phone className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => startCall('video')}
                    className="p-2.5 rounded-full bg-purple-950/20 border border-purple-900/30 text-purple-400 hover:text-white hover:bg-purple-900/40 transition-all"
                    title="Start Video Call"
                  >
                    <Video className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {/* Chat Message list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#0a0912]/20">
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-gray-600 py-16">
                    Say Hello to start a conversation! Double-tap messages to react ❤️.
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isSelf = String(msg.sender?._id || msg.sender) === String(currentUser?._id);
                    
                    return (
                      <div
                        key={msg._id || index}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'} group/msg relative`}
                      >
                        <div className="relative max-w-xs sm:max-w-md">
                          
                          {/* Message bubble */}
                          <div
                            onDoubleClick={() => handleReaction(msg._id, '❤️')}
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words cursor-pointer select-none relative ${
                              isSelf
                                ? 'bg-gradient-to-r from-accent to-accent-dark text-white rounded-br-none shadow-lg shadow-purple-500/5'
                                : 'bg-[#1b1926]/90 border border-purple-950/75 text-gray-200 rounded-bl-none'
                            }`}
                          >
                            {/* Image Attachment view */}
                            {msg.messageType === 'image' ? (
                              <div className="space-y-1.5 max-w-[240px]">
                                <img
                                  src={getFileUrl(msg.fileUrl)}
                                  alt="Attachment"
                                  className="w-full h-auto rounded-lg border border-purple-950 max-h-56 object-cover hover:scale-[1.01] transition-transform duration-300"
                                />
                                <span className="block text-[8px] opacity-65 text-right font-semibold">Media File</span>
                              </div>
                            ) : (
                              msg.content
                            )}

                            {/* Timestamp overlay */}
                            <span className="block text-[8px] text-gray-500 mt-1.5 text-right font-mono">
                              {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Message Reactions display overlay */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className={`absolute bottom-[-10px] ${isSelf ? 'left-2' : 'right-2'} bg-[#12101b] border border-purple-900/50 rounded-full px-1.5 py-0.5 flex gap-0.5 items-center shadow-lg text-[10px]`}>
                              {Array.from(new Set(msg.reactions.map(r => r.emoji))).map((emoji, idx) => (
                                <span key={idx}>{emoji}</span>
                              ))}
                              {msg.reactions.length > 1 && (
                                <span className="text-[8px] font-bold text-gray-400 ml-0.5">{msg.reactions.length}</span>
                              )}
                            </div>
                          )}

                          {/* Emoji reaction picker on hover (Instagram style) */}
                          <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity duration-250 flex items-center bg-[#100d1b] border border-purple-900/40 rounded-full px-2 py-1 shadow-xl z-20 space-x-1.5 ${
                            isSelf ? 'left-[-150px]' : 'right-[-150px]'
                          }`}>
                            {['❤️', '👍', '😂', '😮', '😢', '🙏'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg._id, emoji)}
                                className="hover:scale-125 transition-transform duration-150 text-xs"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}

                {/* Live Typing indicator pill */}
                {isPeerTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#1b1926]/40 border border-purple-950/20 text-gray-500 px-4 py-2.5 rounded-2xl rounded-bl-none text-[10px] italic flex items-center gap-1.5 animate-pulse">
                      <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-100"></span>
                      <span className="w-1 h-1 bg-gray-500 rounded-full animate-bounce delay-200"></span>
                      Typing...
                    </div>
                  </div>
                )}
                
                <div ref={chatBottomRef}></div>
              </div>

              {/* Chat Send Input bar */}
              <div className="p-4 border-t border-purple-950/45 bg-[#08070d]/50">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative bg-[#06050a] border border-purple-950 rounded-2xl px-4 py-2">
                  
                  {/* Plus button to send media */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="p-1 text-purple-400 hover:text-white transition-colors disabled:opacity-50 shrink-0"
                    title="Send Image File"
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Plus className="h-5 w-5 hover:rotate-90 transition-transform duration-250" />
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSend}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Input field */}
                  <input
                    type="text"
                    placeholder="Message..."
                    value={newMessage}
                    onChange={handleInputChange}
                    className="flex-1 bg-transparent text-xs text-gray-200 placeholder:text-gray-700 py-1.5 focus:outline-none"
                  />

                  {/* Send Button */}
                  {newMessage.trim().length > 0 && (
                    <button
                      type="submit"
                      className="text-accent hover:text-white text-xs font-bold font-accent transition-colors py-1 px-2 uppercase tracking-wide shrink-0"
                    >
                      Send
                    </button>
                  )}
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-[#0a0a0f]/10">
              <div className="bg-purple-950/30 p-4.5 rounded-full border border-purple-900/30 text-accent">
                <MessageSquare className="h-11 w-11 animate-pulse" />
              </div>
              <h3 className="font-accent text-lg font-bold text-white">Direct Threads</h3>
              <p className="text-xs text-gray-500 max-w-xs">
                Select a developer or employer from your sidebar list to load historical messages and launch real-time WebRTC connections.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* WebRTC Calling Modal Overlay */}
      {callActive && socket && (
        <CallModal
          socket={socket}
          callInfo={callInfo}
          onClose={() => {
            setCallActive(false);
            setCallInfo(null);
          }}
        />
      )}
    </div>
  );
}
