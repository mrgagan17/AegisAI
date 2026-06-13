const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.use(protect, isAdmin); // All routes in this file require JWT and Admin role

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.put('/user/:id/suspend', adminController.suspendUser);
router.delete('/user/:id', adminController.deleteUser);
router.get('/documents', adminController.getDocuments);
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
