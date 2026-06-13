const Conversation = require('../models/Conversation');
const Chat = require('../models/Chat');
const ragService = require('../services/ragService');

/**
 * @desc    Ask a question based on uploaded documents (RAG)
 * @route   POST /api/chat/ask
 * @access  Private
 */
exports.askQuestion = async (req, res) => {
  try {
    const { question, conversationId, documentIds } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({ success: false, message: 'Please provide a question' });
    }

    const result = await ragService.askQuestion(req.user.id, question, {
      conversationId,
      documentIds
    });

    return res.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      conversationId: result.conversationId,
      conversationTitle: result.conversationTitle
    });
  } catch (error) {
    console.error('Ask question error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during question answering' });
  }
};

/**
 * @desc    Get user's chat conversations
 * @route   GET /api/chat/conversations
 * @access  Private
 */
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ userId: req.user.id })
      .select('title createdAt')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: conversations.length, conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get conversation details with message history
 * @route   GET /api/chat/conversations/:id
 * @access  Private
 */
exports.getConversationDetails = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    return res.json({ success: true, conversation });
  } catch (error) {
    console.error('Get conversation details error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Delete a conversation
 * @route   DELETE /api/chat/conversations/:id
 * @access  Private
 */
exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    return res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Get raw Q&A logs (history) for statistics/search
 * @route   GET /api/chat/history
 * @access  Private
 */
exports.getChatHistory = async (req, res) => {
  try {
    const history = await Chat.find({ userId: req.user.id }).sort({ timestamp: -1 });
    return res.json({ success: true, count: history.length, history });
  } catch (error) {
    console.error('Get chat history error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
