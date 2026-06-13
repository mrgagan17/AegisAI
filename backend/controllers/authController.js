const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_access_key_123456';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'supersecret_jwt_refresh_key_654321';

// Helper to generate access and refresh tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: '15m'
  });
  
  const refreshToken = jwt.sign({ id: userId }, JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });

  return { accessToken, refreshToken };
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already registered with this email' });
    }

    // If first user, make them admin automatically for easy setup
    const isFirstUser = (await User.countDocuments({})) === 0;
    const role = isFirstUser ? 'admin' : 'user';

    const user = await User.create({
      name,
      email,
      password,
      role
    });

    const { accessToken, refreshToken } = generateTokens(user._id);

    return res.status(201).json({
      success: true,
      message: isFirstUser ? 'First user registered. Granted ADMIN role.' : 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
};

/**
 * @desc    Log in user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check for user and include password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if suspended
    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'This account has been suspended by an administrator' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

/**
 * @desc    Rotate access token using refresh token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ success: false, message: 'This account has been suspended' });
    }

    // Generate new access and refresh tokens (sliding session)
    const tokens = generateTokens(user._id);

    return res.json({
      success: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

/**
 * @desc    Log out user
 * @route   POST /api/auth/logout
 * @access  Public
 */
exports.logout = async (req, res) => {
  // Clear local cookies or token states
  // In stateless JWT, logout is primarily handled by client discarding the tokens.
  // We send a success message.
  return res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * @desc    Forgot password request
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      // Return 200 for security reasons to prevent user enumeration
      return res.json({ success: true, message: 'If a matching account exists, a reset code has been sent' });
    }

    // Generate a temporary reset token (JWT valid for 10 minutes)
    const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '10m' });

    // Print the reset token to the terminal console so the beginner user doesn't need SMTP keys
    console.log('\n================ PASSWORD RESET REQUEST ================');
    console.log(`User: ${user.name} (${user.email})`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Local UI Link: http://localhost:5173/reset-password?token=${resetToken}`);
    console.log('========================================================\n');

    return res.json({ 
      success: true, 
      message: 'Password reset link generated. Check the terminal server console for the link!',
      resetToken // Also return it in body in development so they can test the API flow easily
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    return res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
