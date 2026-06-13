const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All routes under this file require JWT authentication

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

module.exports = router;
