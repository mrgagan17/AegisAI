const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All routes require JWT authentication

router.post('/ask', chatController.askQuestion);
router.get('/history', chatController.getChatHistory);
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:id', chatController.getConversationDetails);
router.delete('/conversations/:id', chatController.deleteConversation);

module.exports = router;
