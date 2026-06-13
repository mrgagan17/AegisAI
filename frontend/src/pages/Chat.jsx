import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import { 
  Bot, 
  Send, 
  Plus, 
  Trash2, 
  FileDown, 
  FolderLock, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  MessageSquare,
  Clock,
  ExternalLink
} from 'lucide-react';

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userFiles, setUserFiles] = useState([]); // List of uploaded completed documents
  const [selectedFileIds, setSelectedFileIds] = useState([]); // Checked file IDs for retrieval filtering
  const [inputQuestion, setInputQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // UI states
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [expandedCitationIndex, setExpandedCitationIndex] = useState(null); // Tracks clicked citations

  const messagesEndRef = useRef(null);
  const fileSelectorRef = useRef(null);

  // 2. Select conversation details
  const handleSelectConversation = useCallback(async (convId) => {
    setActiveConvId(convId);
    setExpandedCitationIndex(null);
    try {
      const response = await api.get(`/chat/conversations/${convId}`);
      setMessages(response.data.conversation.messages);
    } catch (error) {
      console.error('Failed to fetch conversation messages:', error);
    }
  }, []);

  // 1. Fetch conversations & documents
  const fetchConversations = useCallback(async (selectFirst = false) => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data.conversations);
      
      if (selectFirst && response.data.conversations.length > 0) {
        handleSelectConversation(response.data.conversations[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  }, [handleSelectConversation]);

  const fetchUserFiles = useCallback(async () => {
    try {
      const response = await api.get('/documents');
      const completedFiles = response.data.documents.filter(d => d.processingStatus === 'Completed');
      setUserFiles(completedFiles);
    } catch (error) {
      console.error('Failed to fetch user documents:', error);
    }
  }, []);

  useEffect(() => {
    fetchConversations(true);
    fetchUserFiles();
  }, [fetchConversations, fetchUserFiles]);

  // Scroll messages panel to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, submitting]);

  // Click outside to close document selector dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (fileSelectorRef.current && !fileSelectorRef.current.contains(event.target)) {
        setShowFileSelector(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  // 3. Start New Chat Session
  const handleNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setExpandedCitationIndex(null);
  };

  // 4. Send question to RAG
  const handleSendQuestion = async (e) => {
    e.preventDefault();
    if (!inputQuestion || inputQuestion.trim() === '' || submitting) return;

    const question = inputQuestion.trim();
    setInputQuestion('');
    setSubmitting(true);
    setExpandedCitationIndex(null);

    // Optimistically push user message to UI
    const userMsg = {
      sender: 'user',
      text: question,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await api.post('/chat/ask', {
        question,
        conversationId: activeConvId,
        documentIds: selectedFileIds // Passes selected file list for filtering!
      });

      const { answer, sources, conversationId, conversationTitle } = response.data;

      // Update messages list with AI reply
      const aiMsg = {
        sender: 'ai',
        text: answer,
        sources,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, aiMsg]);

      // If it was a new conversation, update active ID and refresh sidebar list
      if (!activeConvId) {
        setActiveConvId(conversationId);
        fetchConversations(false);
      }
    } catch (error) {
      console.error('Failed to send question:', error);
      
      const errorMsg = {
        sender: 'ai',
        text: error.response?.data?.message || 'Error occurred. Please verify database connection and Gemini API status.',
        sources: [],
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Delete a conversation
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation(); // Avoid triggering select conversation
    if (!window.confirm('Delete this conversation?')) return;

    try {
      await api.delete(`/chat/conversations/${convId}`);
      setConversations(prev => prev.filter(c => c._id !== convId));
      
      if (activeConvId === convId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // 6. Toggle File Selection check
  const handleToggleFileSelection = (fileId) => {
    setSelectedFileIds((prev) => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  // 7. Export current conversation transcript to PDF
  const handleExportPDF = () => {
    if (messages.length === 0) return;

    const doc = new jsPDF();
    let yOffset = 20;

    // Header styling
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(60, 80, 240); // Brand primary HSL color
    doc.text('AegisAI Chat Transcript', 14, yOffset);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    yOffset += 8;
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, yOffset);
    yOffset += 12;

    // Draw partition line
    doc.setDrawColor(220);
    doc.line(14, yOffset, 196, yOffset);
    yOffset += 10;

    messages.forEach((msg) => {
      // Manage page break
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 20;
      }

      // Sender tag
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      if (msg.sender === 'user') {
        doc.setTextColor(70, 70, 80);
        doc.text('User Question:', 14, yOffset);
      } else {
        doc.setTextColor(40, 150, 80);
        doc.text('AegisAI Grounded Answer:', 14, yOffset);
      }
      yOffset += 6;

      // Text block formatting
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(50);
      const splitLines = doc.splitTextToSize(msg.text, 180);
      
      splitLines.forEach((line) => {
        if (yOffset > 275) {
          doc.addPage();
          yOffset = 20;
        }
        doc.text(line, 14, yOffset);
        yOffset += 5;
      });

      yOffset += 6; // Spacing between messages
    });

    doc.save(`conversation-transcript-${activeConvId || 'new'}.pdf`);
  };

  return (
    <div className="flex-1 flex bg-slate-50 dark:bg-[#0b0c10] h-[calc(100vh-4rem)]">
      
      {/* 1. Left Sidebar: Conversation session selector list */}
      <div className="w-72 border-r border-slate-200/50 bg-white/50 dark:border-dark-800/40 dark:bg-dark-900/30 flex flex-col justify-between hidden md:flex">
        
        {/* Sidebar Header: Plus New Chat */}
        <div className="p-4 border-b border-slate-200/50 dark:border-dark-800/40">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 transition-all active:scale-[0.98] btn-glow"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </button>
        </div>

        {/* Scrollable List of Sessions */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center py-10 text-[11px] text-slate-400">
              No previous conversations
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv._id}
                onClick={() => handleSelectConversation(conv._id)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer group transition-all text-xs font-medium ${
                  activeConvId === conv._id
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-250 dark:hover:bg-dark-900/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className="h-4 w-4 shrink-0 text-slate-450 dark:text-slate-500" />
                  <span className="truncate">{conv.title}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteConversation(e, conv._id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Sidebar Footer: System tag */}
        <div className="p-4 border-t border-slate-200/50 dark:border-dark-800/40 text-[10px] text-slate-400 flex items-center gap-1.5 bg-slate-50/50 dark:bg-dark-950/30">
          <Clock className="h-3.5 w-3.5 text-slate-450" />
          <span>Conversations saved automatically</span>
        </div>
      </div>

      {/* 2. Main Chat Panel */}
      <div className="flex-1 flex flex-col justify-between h-full bg-white dark:bg-[#090a0f] relative">
        
        {/* Main Panel Header */}
        <header className="h-16 border-b border-slate-200/50 dark:border-dark-800/40 flex items-center justify-between px-6 bg-white/80 dark:bg-[#090a0f]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-brand-600" />
            <span className="font-semibold text-sm text-slate-800 dark:text-white">AI Copilot</span>
          </div>

          <div className="flex items-center space-x-3.5">
            {/* Multi-document Selection Dropdown */}
            <div className="relative" ref={fileSelectorRef}>
              <button
                onClick={() => setShowFileSelector(!showFileSelector)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-dark-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-850 transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Ref Files ({selectedFileIds.length === 0 ? 'All' : selectedFileIds.length})</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {/* Selector Overlay Drawer */}
              {showFileSelector && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white dark:border-dark-800 dark:bg-dark-900 shadow-xl p-4 z-50 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold border-b border-slate-100 dark:border-dark-850 pb-2">
                    <span className="text-slate-700 dark:text-slate-300">Grounding Context</span>
                    <button 
                      onClick={() => setSelectedFileIds([])}
                      className="text-[10px] text-brand-600 hover:underline"
                    >
                      Clear Filters
                    </button>
                  </div>
                  
                  {/* Document checkboxes list */}
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {userFiles.length === 0 ? (
                      <p className="text-[10px] text-slate-400 py-4 text-center">
                        No active indexed documents found. Upload files in the dashboard first!
                      </p>
                    ) : (
                      userFiles.map((file) => (
                        <label 
                          key={file._id}
                          className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-850 cursor-pointer text-xs transition-colors"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 rounded text-brand-600 border-slate-300 focus:ring-brand-500"
                            checked={selectedFileIds.includes(file._id)}
                            onChange={() => handleToggleFileSelection(file._id)}
                          />
                          <span className="truncate text-slate-700 dark:text-slate-300 font-medium" title={file.fileName}>
                            {file.fileName}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-[9px] text-slate-400 leading-relaxed bg-slate-50 dark:bg-dark-950 p-2 rounded-lg">
                    By default, the AI retrieves matches from all uploaded files. Check specific files to isolate the search area.
                  </p>
                </div>
              )}
            </div>

            {/* Export PDF Button */}
            {messages.length > 0 && (
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-dark-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-355 bg-white dark:bg-dark-900 hover:bg-slate-50 dark:hover:bg-dark-850 transition-colors"
                title="Export Conversation PDF"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>
            )}
          </div>
        </header>

        {/* 3. Messages Window */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            /* Empty Chat Welcomer Panel */
            <div className="h-full flex flex-col items-center justify-center text-center space-y-5 max-w-lg mx-auto py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-lg shadow-brand-500/20">
                <Bot className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Ask AegisAI Grounded Agent</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Start a conversation. AegisAI will execute semantic vector lookups over your files and generate replies matching only the context found, citing source documents.
                </p>
              </div>
              
              {/* Info alerts */}
              {userFiles.length === 0 && (
                <div className="flex items-start gap-2 text-left p-3.5 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400">
                  <FolderLock className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">No documents indexed yet:</span> Go to the Dashboard to upload company reference documents so the AI agent has material to answer from.
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Rendered Message List */
            <div className="space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.sender === 'user';
                return (
                  <div 
                    key={index}
                    className={`flex gap-4.5 max-w-3xl animate-fade-in ${
                      isUser ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    {/* Message Avatar */}
                    <div className={`flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl font-bold text-xs shadow-sm ${
                      isUser 
                        ? 'bg-slate-900 text-white dark:bg-dark-800'
                        : 'bg-gradient-to-tr from-brand-600 to-indigo-500 text-white'
                    }`}>
                      {isUser ? 'U' : <Bot className="h-4 w-4" />}
                    </div>

                    {/* Message Card */}
                    <div className="space-y-2">
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-brand-600 text-white'
                          : 'glass-card text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-dark-850'
                      }`}>
                        {/* Preserve formatting of text blocks */}
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>

                      {/* Citation accordion for AI message */}
                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div className="pl-1.5">
                          <button
                            onClick={() => setExpandedCitationIndex(expandedCitationIndex === index ? null : index)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline focus:outline-none"
                          >
                            <Sparkles className="h-3 w-3" />
                            <span>Grounded Citations ({msg.sources.length} sources)</span>
                            {expandedCitationIndex === index ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>

                          {/* Expanded citation text panels */}
                          {expandedCitationIndex === index && (
                            <div className="mt-2 space-y-2 max-w-xl animate-slide-up">
                              {msg.sources.map((src, sIdx) => (
                                <div 
                                  key={sIdx}
                                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-dark-850 dark:bg-dark-900/40 text-[10px]"
                                >
                                  <div className="flex items-center justify-between text-slate-700 dark:text-slate-300 font-bold border-b border-slate-150/40 pb-1 mb-1">
                                    <span className="truncate max-w-xs">{src.fileName}</span>
                                    <span className="text-[9px] text-slate-400">Source passage {sIdx + 1}</span>
                                  </div>
                                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed italic bg-white dark:bg-dark-950 p-2 rounded-lg border border-slate-200/20">
                                    "{src.chunkText}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Bot typing indicator */}
              {submitting && (
                <div className="flex gap-4.5 max-w-lg">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-bold text-xs shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="glass-card p-4 rounded-2xl flex items-center space-x-1 border-slate-200/60 dark:border-dark-850">
                      <div className="w-2 h-2 bg-slate-500 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full typing-dot"></div>
                      <div className="w-2 h-2 bg-slate-500 rounded-full typing-dot"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 4. Chat Entry Input Bar */}
        <footer className="p-4 border-t border-slate-200/50 dark:border-dark-800/40 bg-white dark:bg-[#090a0f] z-10">
          <form onSubmit={handleSendQuestion} className="max-w-3xl mx-auto flex items-center gap-3 relative">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder={userFiles.length === 0 ? "Upload reference documents to begin..." : "Ask a question from uploaded documents..."}
              disabled={userFiles.length === 0 || submitting}
              className="w-full rounded-2xl border pl-4 pr-12 py-3.5 text-xs bg-slate-50/50 dark:bg-dark-900 border-slate-200 dark:border-dark-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-dark-950 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || submitting}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-sm disabled:opacity-50 transition-all active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="text-[9px] text-center text-slate-400 dark:text-slate-500 mt-2 max-w-lg mx-auto">
            AegisAI grounds chat logs using Retrieval-Augmented Generation. Answers are strictly bounded to the content in reference documents.
          </div>
        </footer>

      </div>
    </div>
  );
}

export default Chat;
