"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./style.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  type?: "normal" | "email-draft"; // ✅ Track message type
  emailData?: EmailDraft; // ✅ Store email draft data
}

interface EmailDraft {
  to: string;
  subject: string;
  preview: string;
  fullContent: string;
  recipientName: string;
  recipientEmail: string;
  context?: any;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

interface DynamicEmailContext {
  [key: string]: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  status?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  // ✅ Dynamic email form data
  const [emailFormData, setEmailFormData] = useState({
    to: "",
    cc: "",
    bcc: "",
    context: {} as DynamicEmailContext,
    prompt: "",
  });

  // ✅ Dynamic context fields
  const [contextFields, setContextFields] = useState<Array<{ key: string; value: string }>>([
    { key: "recipientName", value: "" },
    { key: "recipientCompany", value: "" },
  ]);

  const hasStartedChat = messages.length > 0;

  useEffect(() => {
    console.log("API URL:", API_URL);
  }, []);

  useEffect(() => {
    const savedSessions = localStorage.getItem("chatSessions");
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      const sessions = parsed.map((session: any) => ({
        ...session,
        timestamp: new Date(session.timestamp),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }));
      setChatSessions(sessions);
    }
  }, []);

  useEffect(() => {
    if (chatSessions.length > 0) {
      localStorage.setItem("chatSessions", JSON.stringify(chatSessions));
    }
  }, [chatSessions]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  useEffect(() => {
    if (messages.length > 0 && currentSessionId) {
      updateCurrentSession();
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
    }
  };

  const generateTitle = (firstMessage: string): string => {
    return firstMessage.length > 50 
      ? firstMessage.substring(0, 50) + "..." 
      : firstMessage;
  };

  const updateCurrentSession = () => {
    if (!currentSessionId) return;

    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId
          ? {
              ...session,
              messages: messages,
              lastMessage: messages[messages.length - 1]?.content.substring(0, 60) || "",
              timestamp: new Date(),
            }
          : session
      )
    );
  };

  // ✅ Detect if message is an email request
  const isEmailRequest = (message: string): boolean => {
    const emailKeywords = [
      'send email', 'send mail', 'send a mail', 'send a email',
      'email to', 'mail to', 'write email', 'draft email',
      'send reminder', 'send follow-up', 'reach out to'
    ];
    
    const lowerMessage = message.toLowerCase();
    return emailKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  // ✅ Extract recipient from message
  const extractRecipient = (message: string, previousMessages: Message[]): Lead | null => {
    // Check for explicit email addresses
    const emailMatch = message.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) {
      return {
        id: 'manual',
        name: 'Recipient',
        email: emailMatch[1],
      };
    }

    // Check for names mentioned in the message
    const namePatterns = [
      /(?:to|email|mail)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
      /send.*?(?:to|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    ];

    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        const name = match[1];
        
        // Search for this lead in previous messages
        for (let i = previousMessages.length - 1; i >= 0; i--) {
          const msg = previousMessages[i];
          if (msg.role === 'assistant') {
            const leads = parseLeadsFromMessage(msg.content);
            const foundLead = leads.find(lead => 
              lead.name.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(lead.name.toLowerCase())
            );
            if (foundLead) {
              return foundLead;
            }
          }
        }
        
        return {
          id: 'manual',
          name: name,
          email: '', // Will need to be filled
        };
      }
    }

    // If no recipient found, try to get the most recent lead
    for (let i = previousMessages.length - 1; i >= 0; i--) {
      const msg = previousMessages[i];
      if (msg.role === 'assistant') {
        const leads = parseLeadsFromMessage(msg.content);
        if (leads.length > 0) {
          return leads[0]; // Return first lead from most recent list
        }
      }
    }

    return null;
  };

  // ✅ Parse leads from AI response
  const parseLeadsFromMessage = (content: string): Lead[] => {
    const leads: Lead[] = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const match = line.match(/\d+\.\s*([^–]+)\s*–\s*([^–\s]+@[^–\s]+)\s*–\s*(?:([^–]+)\s*–\s*)?Status:\s*(.+)/i);
      if (match) {
        leads.push({
          id: `lead_${leads.length}`,
          name: match[1].trim(),
          email: match[2].trim(),
          company: match[3]?.trim(),
          status: match[4]?.trim(),
        });
      }
    });
    
    return leads;
  };

  // ✅ Generate email draft via API
  const generateEmailDraft = async (recipient: Lead, prompt: string): Promise<EmailDraft | null> => {
    try {
      const context: DynamicEmailContext = {
        recipientName: recipient.name,
        recipientEmail: recipient.email,
      };

      if (recipient.company) context.recipientCompany = recipient.company;
      if (recipient.status) context.leadStatus = recipient.status;

      console.log("Generating email draft...");

      const res = await fetch(`${API_URL}/mail/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          prompt,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.message || "Failed to generate email draft");
      }

      return {
        to: recipient.email,
        subject: data.draft.subject,
        preview: data.draft.text?.substring(0, 300) || data.draft.html?.replace(/<[^>]*>/g, "").substring(0, 300),
        fullContent: data.draft.html || data.draft.text,
        recipientName: recipient.name,
        recipientEmail: recipient.email,
        context: data.draft,
      };

    } catch (err: any) {
      console.error("Draft generation error:", err);
      return null;
    }
  };

  // ✅ Send the drafted email
  const sendDraftedEmail = async (emailDraft: EmailDraft) => {
    try {
      setIsLoading(true);

      // Add sending status message
      const sendingMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `Sending email to ${emailDraft.recipientName} (${emailDraft.to})...`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, sendingMessage]);

      console.log("Sending email...");

      const res = await fetch(`${API_URL}/mail/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailDraft.to,
          subject: emailDraft.subject,
          html: emailDraft.context.html,
          text: emailDraft.context.text,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.message || "Failed to send email");
      }

      // Show success message
      const successMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `✅ **Email Sent Successfully!**\n\n**To:** ${emailDraft.to}\n**Subject:** ${emailDraft.subject}\n**Message ID:** ${data.messageId}\n\nYour email has been delivered to ${emailDraft.recipientName}.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMessage]);

    } catch (err: any) {
      console.error("Email send error:", err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ **Email Failed**\n\nError: ${err.message}\n\nPlease try again or contact support.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Main message handler with email detection
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    if (messages.length === 0) {
      const newSessionId = Date.now().toString();
      const newSession: ChatSession = {
        id: newSessionId,
        title: generateTitle(inputValue.trim()),
        lastMessage: inputValue.trim().substring(0, 60),
        timestamp: new Date(),
        messages: [userMessage],
      };
      
      setCurrentSessionId(newSessionId);
      setChatSessions((prev) => [newSession, ...prev]);
    }

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      // ✅ Check if this is an email request
      if (isEmailRequest(currentInput)) {
        console.log("📧 Email request detected!");

        // Extract recipient from message or previous context
        const recipient = extractRecipient(currentInput, messages);
        
        if (!recipient) {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "❌ I couldn't identify who you want to send the email to. Please specify the recipient's name or email address.\n\nFor example:\n- \"Send email to John Doe\"\n- \"Email siddarth@zodopt.com\"",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsLoading(false);
          return;
        }

        if (!recipient.email) {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `❌ I found the recipient "${recipient.name}" but don't have their email address. Please provide it or select from your leads list.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsLoading(false);
          return;
        }

        // Show drafting status
        const draftingMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `📝 Drafting email for ${recipient.name} (${recipient.email})...\n\nAnalyzing context and generating personalized content...`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, draftingMessage]);

        // Generate email draft
        const emailDraft = await generateEmailDraft(recipient, currentInput);

        if (!emailDraft) {
          const errorMessage: Message = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content: "❌ Failed to generate email draft. Please try again with more specific instructions.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          setIsLoading(false);
          return;
        }

        // Show draft for review
        const draftMessage: Message = {
          id: (Date.now() + 3).toString(),
          role: "assistant",
          content: `📧 **Email Draft Ready for Review**\n\n**To:** ${emailDraft.to}\n**Recipient:** ${emailDraft.recipientName}\n**Subject:** ${emailDraft.subject}\n\n**Email Preview:**\n${emailDraft.preview}${emailDraft.preview.length >= 300 ? '...' : ''}\n\n---\n\n✅ Ready to send this email?`,
          timestamp: new Date(),
          type: "email-draft",
          emailData: emailDraft,
        };
        setMessages((prev) => [...prev, draftMessage]);

      } else {
        // ✅ Regular chat message - send to backend
        console.log("Sending message to:", `${API_URL}/chat`);

        const response = await fetch(`${API_URL}/chat`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({
            message: currentInput,
            history: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            sessionId: currentSessionId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }

        const data = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply || "I apologize, but I couldn't generate a response. Please try again.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'm having trouble connecting to the server at ${API_URL}. Please check if the backend is running and try again.`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Add context field
  const addContextField = () => {
    setContextFields([...contextFields, { key: "", value: "" }]);
  };

  // ✅ Remove context field
  const removeContextField = (index: number) => {
    setContextFields(contextFields.filter((_, i) => i !== index));
  };

  // ✅ Update context field
  const updateContextField = (index: number, field: "key" | "value", newValue: string) => {
    const updated = [...contextFields];
    updated[index][field] = newValue;
    setContextFields(updated);
  };

  // ✅ Build context object from fields
  const buildContextObject = (): DynamicEmailContext => {
    const context: DynamicEmailContext = {};
    contextFields.forEach(field => {
      if (field.key.trim() && field.value.trim()) {
        context[field.key.trim()] = field.value.trim();
      }
    });
    return context;
  };

  // ✅ Send dynamic email (from modal)
  const sendDynamicEmail = async () => {
    try {
      setIsLoading(true);
      
      const context = buildContextObject();
      
      const contextPreview = Object.entries(context)
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
      
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: `📧 Sending Dynamic Email\n\n**To:** ${emailFormData.to}${emailFormData.cc ? `\n**CC:** ${emailFormData.cc}` : ""}${emailFormData.bcc ? `\n**BCC:** ${emailFormData.bcc}` : ""}\n\n**Context:**\n${contextPreview}\n\n**Prompt:**\n${emailFormData.prompt}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      console.log("Sending dynamic email to:", `${API_URL}/mail/send-dynamic-email`);

      const res = await fetch(`${API_URL}/mail/send-dynamic-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: emailFormData.to,
          cc: emailFormData.cc || undefined,
          bcc: emailFormData.bcc || undefined,
          context,
          prompt: emailFormData.prompt,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.message || "Failed to send email");
      }

      const recipientInfo = [
        `To: ${Array.isArray(data.recipients?.to) ? data.recipients.to.join(", ") : emailFormData.to}`,
        data.recipients?.cc?.length > 0 ? `CC: ${data.recipients.cc.join(", ")}` : "",
        data.recipients?.bcc?.length > 0 ? `BCC: ${data.recipients.bcc.join(", ")}` : "",
      ].filter(Boolean).join("\n");

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `✅ **Email Sent Successfully!**\n\n${recipientInfo}\n\n**Subject:** ${data?.draft?.subject || "N/A"}\n\n**Preview:**\n${data?.draft?.preview || "Email generated and sent"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      setEmailFormData({
        to: "",
        cc: "",
        bcc: "",
        context: {},
        prompt: "",
      });
      setContextFields([
        { key: "recipientName", value: "" },
        { key: "recipientCompany", value: "" },
      ]);
      setShowEmailModal(false);

    } catch (err: any) {
      console.error("Email send error:", err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ **Email Failed**\n\nError: ${err.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setInputValue("");
    setCurrentSessionId(null);
  };

  const handleLoadSession = (sessionId: string) => {
    const session = chatSessions.find((s) => s.id === sessionId);
    if (session) {
      setMessages(session.messages);
      setCurrentSessionId(sessionId);
      setShowSidebar(false);
    }
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (window.confirm("Delete this chat?")) {
      setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
      
      if (currentSessionId === sessionId) {
        setMessages([]);
        setCurrentSessionId(null);
      }
    }
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleLogout = () => {
    if (window.confirm("Logout? Your chat history will be cleared.")) {
      localStorage.removeItem("chatSessions");
      router.push("/login");
    }
  };

  const loadEmailTemplate = (template: string) => {
    switch (template) {
      case "lead":
        setContextFields([
          { key: "recipientName", value: "" },
          { key: "recipientCompany", value: "" },
          { key: "leadStatus", value: "Warm" },
          { key: "industry", value: "" },
        ]);
        setEmailFormData(prev => ({ ...prev, prompt: "Write a professional follow-up email to discuss our solutions" }));
        break;
      case "partnership":
        setContextFields([
          { key: "recipientName", value: "" },
          { key: "recipientCompany", value: "" },
          { key: "recipientRole", value: "" },
          { key: "partnershipType", value: "" },
          { key: "meetingContext", value: "" },
        ]);
        setEmailFormData(prev => ({ ...prev, prompt: "Write a partnership proposal email highlighting mutual benefits" }));
        break;
      case "event":
        setContextFields([
          { key: "recipientName", value: "" },
          { key: "eventName", value: "" },
          { key: "eventDate", value: "" },
          { key: "eventLocation", value: "" },
          { key: "keyBenefit", value: "" },
        ]);
        setEmailFormData(prev => ({ ...prev, prompt: "Create an engaging event invitation email" }));
        break;
      case "custom":
        setContextFields([{ key: "", value: "" }]);
        setEmailFormData(prev => ({ ...prev, prompt: "" }));
        break;
    }
  };

  const suggestedPrompts = [
    {
      icon: "📊",
      title: "Analyze Lead Performance",
      prompt: "Analyze the performance of my leads and identify the top converting sources",
    },
    {
      icon: "🎯",
      title: "Lead Segmentation",
      prompt: "Help me segment my leads based on their engagement levels and demographics",
    },
    {
      icon: "📈",
      title: "Conversion Insights",
      prompt: "What insights can you provide about my lead conversion rates and patterns?",
    },
    {
      icon: "💡",
      title: "Lead Quality Assessment",
      prompt: "Assess the quality of my current leads and suggest improvements for lead generation",
    },
  ];

  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  // ✅ Render assistant messages with email draft actions
  const renderAssistantMessage = (message: Message) => {
    const isEmailDraft = message.type === "email-draft" && message.emailData;

    return (
      <div key={message.id} className={`${styles.messageWrapper} ${styles.assistantMessage}`}>
        <div className={styles.messageContent}>
          <div className={styles.messageAvatar}>
            <span className={styles.assistantAvatarText}>O</span>
          </div>
          <div className={styles.messageText}>
            <div className={styles.messageRole}>OPTI</div>
            <div className={styles.messageBody} style={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </div>
            
            {/* ✅ Email Draft Actions */}
            {isEmailDraft && message.emailData && (
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => sendDraftedEmail(message.emailData!)}
                  disabled={isLoading}
                  style={{
                    padding: '10px 20px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  {isLoading ? 'Sending...' : 'Send Email'}
                </button>
                
                <button
                  onClick={() => {
                    const fullEmail = `**Full Email Content:**\n\n**To:** ${message.emailData!.to}\n**Subject:** ${message.emailData!.subject}\n\n**Body:**\n${message.emailData!.fullContent.replace(/<[^>]*>/g, '')}`;
                    const previewMessage: Message = {
                      id: (Date.now() + 999).toString(),
                      role: "assistant",
                      content: fullEmail,
                      timestamp: new Date(),
                    };
                    setMessages((prev) => [...prev, previewMessage]);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  View Full Email
                </button>

                <button
                  onClick={() => {
                    setInputValue("Regenerate that email with a different tone");
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#64748b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Regenerate
                </button>
              </div>
            )}

            <div className={styles.messageActions}>
              <button 
                className={styles.actionButton} 
                title="Copy to clipboard"
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${showSidebar ? styles.sidebarVisible : ""}`}>
        <div className={styles.sidebarHeader}>
          <button className={styles.newChatButton} onClick={handleNewChat}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Chat
          </button>
        </div>

        <div className={styles.chatHistory}>
          <h3 className={styles.chatHistoryTitle}>Recent Chats</h3>
          <div className={styles.chatList}>
            {chatSessions.length === 0 ? (
              <p className={styles.emptyChatList}>No chat history yet. Start analyzing your leads!</p>
            ) : (
              chatSessions.map((session) => (
                <div key={session.id} className={styles.chatItemWrapper}>
                  <button
                    className={`${styles.chatItem} ${
                      currentSessionId === session.id ? styles.chatItemActive : ""
                    }`}
                    onClick={() => handleLoadSession(session.id)}
                  >
                    <div className={styles.chatItemContent}>
                      <svg
                        className={styles.chatItemIcon}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <div className={styles.chatItemText}>
                        <span className={styles.chatItemTitle}>{session.title}</span>
                        <span className={styles.chatItemPreview}>
                          {session.lastMessage}
                        </span>
                        <span className={styles.chatItemTimestamp}>
                          {formatTimestamp(session.timestamp)}
                        </span>
                      </div>
                    </div>
                  </button>
                  <button
                    className={styles.chatItemDelete}
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    aria-label={`Delete ${session.title}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <button className={styles.footerButton}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Profile</span>
          </button>
          <button className={styles.footerButton} onClick={handleSettings}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span>Settings</span>
          </button>
          <button className={styles.footerButton} onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={styles.main}>
        {hasStartedChat && (
          <header className={styles.header}>
            <button
              className={styles.menuButton}
              onClick={() => setShowSidebar(!showSidebar)}
              aria-label="Toggle sidebar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <div className={styles.headerBranding}>
              <h1 className={styles.headerBrandName}>OPTI</h1>
            </div>

            <div className={styles.headerActions}>
              <button 
                className={styles.headerButton} 
                onClick={() => setShowEmailModal(true)}
                title="Advanced Email Composer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </button>
              <button className={styles.headerButton} onClick={handleNewChat}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            </div>
          </header>
        )}

        <div className={styles.chatContainer}>
          {!hasStartedChat ? (
            <div className={styles.welcomeScreen}>
              <div className={styles.welcomeBranding}>
                <h1 className={styles.welcomeBrandName}>OPTI</h1>
                <p className={styles.welcomeTagline}>A Gateway to Excellence</p>
                <p className={styles.welcomeSubtitle}>AI-Powered Lead Intelligence & Analytics</p>
              </div>

              <div className={styles.suggestedPrompts}>
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    className={styles.promptCard}
                    onClick={() => setInputValue(prompt.prompt)}
                  >
                    <span className={styles.promptIcon}>{prompt.icon}</span>
                    <div className={styles.promptContent}>
                      <h3 className={styles.promptTitle}>{prompt.title}</h3>
                      <p className={styles.promptText}>{prompt.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className={styles.quickTips}>
                <p className={styles.quickTipsTitle}>💡 How OPTI Helps:</p>
                <ul className={styles.quickTipsList}>
                  <li>Analyzes your company's lead data in real-time</li>
                  <li>Provides actionable insights for better conversion</li>
                  <li>Sends AI-powered personalized emails to leads</li>
                  <li>Offers data-driven recommendations for growth</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className={styles.messagesContainer}>
              {messages.map((message) => 
                message.role === "user" ? (
                  <div key={message.id} className={`${styles.messageWrapper} ${styles.userMessage}`}>
                    <div className={styles.messageContent}>
                      <div className={styles.messageAvatar}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                      <div className={styles.messageText}>
                        <div className={styles.messageRole}>You</div>
                        <div className={styles.messageBody} style={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  renderAssistantMessage(message)
                )
              )}

              {isLoading && (
                <div className={`${styles.messageWrapper} ${styles.assistantMessage}`}>
                  <div className={styles.messageContent}>
                    <div className={styles.messageAvatar}>
                      <span className={styles.assistantAvatarText}>O</span>
                    </div>
                    <div className={styles.messageText}>
                      <div className={styles.messageRole}>OPTI</div>
                      <div className={styles.typingIndicator}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            <textarea
              ref={textareaRef}
              className={styles.input}
              placeholder="Ask OPTI about your lead data or type 'send email to [name]' to compose..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              rows={1}
            />
            <button
              className={styles.sendButton}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className={styles.inputFooter}>
            💡 Try: "show my leads" then "send email to John" or "send reminder to siddarth@zodopt.com"
          </p>
        </div>
      </main>

      {/* Advanced Email Modal (unchanged) */}
      {showEmailModal && (
        <div className={styles.modal} onClick={() => setShowEmailModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>📧 Advanced Email Composer</h2>
              <button className={styles.modalClose} onClick={() => setShowEmailModal(false)}>
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>📋 Email Template</label>
                <select
                  className={styles.select}
                  onChange={(e) => loadEmailTemplate(e.target.value)}
                  defaultValue=""
                >
                  <option value="">Select a template (optional)</option>
                  <option value="lead">Lead Follow-up</option>
                  <option value="partnership">Partnership Proposal</option>
                  <option value="event">Event Invitation</option>
                  <option value="custom">Start from Scratch</option>
                </select>
              </div>

              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

              <div className={styles.formGroup}>
                <label className={styles.label}>To (Email Address) *</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="recipient@example.com"
                  value={emailFormData.to}
                  onChange={(e) => setEmailFormData({ ...emailFormData, to: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>CC (Optional)</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="cc@example.com"
                  value={emailFormData.cc}
                  onChange={(e) => setEmailFormData({ ...emailFormData, cc: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>BCC (Optional)</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="bcc@example.com"
                  value={emailFormData.bcc}
                  onChange={(e) => setEmailFormData({ ...emailFormData, bcc: e.target.value })}
                />
              </div>

              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className={styles.label}>🎯 Email Context (Key-Value Pairs)</label>
                  <button 
                    type="button"
                    onClick={addContextField}
                    style={{
                      padding: '5px 12px',
                      background: '#4f46e5',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    + Add Field
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {contextFields.map((field, index) => (
                    <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Key (e.g., recipientName)"
                        value={field.key}
                        onChange={(e) => updateContextField(index, 'key', e.target.value)}
                        style={{ flex: 1 }}
                      />
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Value (e.g., John Doe)"
                        value={field.value}
                        onChange={(e) => updateContextField(index, 'value', e.target.value)}
                        style={{ flex: 1 }}
                      />
                      {contextFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContextField(index)}
                          style={{
                            padding: '8px 12px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  💡 Add any context the AI should know: recipientName, company, role, meeting context, tone, urgency, etc.
                </p>
              </div>

              <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

              <div className={styles.formGroup}>
                <label className={styles.label}>✍️ Email Generation Prompt *</label>
                <textarea
                  className={styles.textarea}
                  placeholder="Describe what email you want to send. Example: Write a professional follow-up email proposing a technical demo of our AI platform next week"
                  rows={5}
                  value={emailFormData.prompt}
                  onChange={(e) => setEmailFormData({ ...emailFormData, prompt: e.target.value })}
                />
                <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  📝 Be specific about tone, purpose, call-to-action, and any details you want included
                </p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelBtn} 
                onClick={() => setShowEmailModal(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className={styles.submitBtn} 
                onClick={sendDynamicEmail}
                disabled={isLoading || !emailFormData.to || !emailFormData.prompt}
              >
                {isLoading ? "Generating & Sending..." : "🚀 Generate & Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
