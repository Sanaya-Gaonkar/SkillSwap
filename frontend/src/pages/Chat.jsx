import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, User, Clock, ArrowLeft } from 'lucide-react';

export default function Chat() {
  const { userId: paramUserId } = useParams();
  const { user: currentUser, showToast } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState(paramUserId ? parseInt(paramUserId, 10) : null);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load conversations list
  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations || []);

      // If no active partner selected, default to first conversation if available
      if (!activePartnerId && res.conversations && res.conversations.length > 0) {
        setActivePartnerId(res.conversations[0].partner.id);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load active chat messages
  const loadMessages = async (partnerId) => {
    if (!partnerId) return;
    try {
      const res = await api.getMessages(partnerId);
      setActivePartner(res.targetUser);
      setMessages(res.messages || []);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [currentUser]);

  useEffect(() => {
    if (paramUserId) {
      setActivePartnerId(parseInt(paramUserId, 10));
    }
  }, [paramUserId]);

  useEffect(() => {
    if (activePartnerId) {
      loadMessages(activePartnerId);
    }
  }, [activePartnerId]);

  // Periodic REST polling for new incoming messages every 3 seconds (Section 23)
  useEffect(() => {
    if (!activePartnerId) return;
    const interval = setInterval(() => {
      loadMessages(activePartnerId);
    }, 3000);
    return () => clearInterval(interval);
  }, [activePartnerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartnerId) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await api.sendMessage(activePartnerId, messageText);
      await loadMessages(activePartnerId);
      loadConversations();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-wrapper container" style={{ paddingTop: '1.25rem' }}>
      <div
        className="card"
        style={{
          padding: 0,
          height: 'calc(100vh - 160px)',
          minHeight: '520px',
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 320px) 1fr',
          overflow: 'hidden'
        }}
      >
        {/* Left Column: Conversations List */}
        <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#FAFBFD' }}>
          <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="var(--primary)" /> Chats
            </h2>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length > 0 ? (
              conversations.map((conv) => {
                const isSelected = conv.partner.id === activePartnerId;
                return (
                  <div
                    key={conv.partner.id}
                    onClick={() => setActivePartnerId(conv.partner.id)}
                    style={{
                      padding: '0.875rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <img
                      src={conv.partner.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${conv.partner.name}`}
                      alt={conv.partner.name}
                      style={{ width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dark)' }}>
                          {conv.partner.name}
                        </span>
                        {conv.lastMessageTime && (
                          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>
                            {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--muted)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '2px'
                        }}
                      >
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--muted)' }}>
                <p style={{ fontSize: '13px' }}>No conversations yet.</p>
                <Link to="/discover" className="btn btn-outline btn-sm" style={{ marginTop: '0.75rem' }}>
                  Find Students
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--white)' }}>
          {activePartner ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: '0.85rem 1.25rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <img
                    src={activePartner.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${activePartner.name}`}
                    alt={activePartner.name}
                    style={{ width: '38px', height: '38px', borderRadius: '50%' }}
                  />
                  <div>
                    <Link
                      to={`/profile/${activePartner.id}`}
                      style={{ fontWeight: 700, fontSize: '15px', color: 'var(--dark)' }}
                    >
                      {activePartner.name}
                    </Link>
                    <p className="text-small" style={{ color: 'var(--secondary)', fontWeight: 500 }}>
                      ● Active student • {activePartner.course || 'College'}
                    </p>
                  </div>
                </div>

                <Link to={`/profile/${activePartner.id}`} className="btn btn-outline btn-sm">
                  View Profile
                </Link>
              </div>

              {/* Messages Scroll Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  backgroundColor: '#F8FAFC'
                }}
              >
                {messages.length > 0 ? (
                  messages.map((m) => {
                    const isFromMe = m.sender_id === currentUser.id;
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isFromMe ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                          alignSelf: isFromMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div
                          style={{
                            padding: '0.75rem 1rem',
                            borderRadius: isFromMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            backgroundColor: isFromMe ? 'var(--primary)' : 'var(--white)',
                            color: isFromMe ? 'var(--white)' : 'var(--dark)',
                            boxShadow: 'var(--shadow-sm)',
                            border: isFromMe ? 'none' : '1px solid var(--border)',
                            fontSize: '14px',
                            lineHeight: 1.45,
                            wordBreak: 'break-word'
                          }}
                        >
                          {m.content}
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            color: 'var(--muted)',
                            marginTop: '3px',
                            padding: '0 4px'
                          }}
                        >
                          {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--muted)' }}>
                    <p>Start a conversation with {activePartner.name}!</p>
                    <span className="text-small">Discuss skill swap goals and coordinate learning sessions.</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                style={{
                  padding: '0.85rem 1rem',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  gap: '0.5rem',
                  backgroundColor: 'var(--white)'
                }}
              >
                <input
                  type="text"
                  className="form-input"
                  placeholder={`Message ${activePartner.name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="btn btn-primary"
                  style={{ padding: '0 1.25rem' }}
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--muted)' }}>
              <MessageSquare size={44} className="empty-state-icon" />
              <h3>Select a conversation</h3>
              <p className="text-small" style={{ marginTop: '0.25rem' }}>
                Choose a student from the left panel to begin chatting.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
