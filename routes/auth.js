const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, isAdmin, authorizeRoles} = require('../middlewares/auth');
const authUser = require('../middlewares/authUser');

// This route checks if the current token/user is authenticated
router.get('/admin-check', isAuthenticatedUser, isAdmin, authorizeRoles, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// Route for regular user token verification (only non-admins)
router.get('/user-check', authUser, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

router.get('/verify', isAuthenticatedUser, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      role: req.user.role
    }
  });
});

// New endpoint for tab context validation
router.get('/validate-context', isAuthenticatedUser,
  (req, res) => {
    const tabContext = req.headers['x-tab-context'];
    const isAdmin = req.user.role.toLowerCase() === 'admin';
    
    if (!tabContext) {
      return res.status(200).json({
        valid: true,
        recommendedContext: isAdmin ? 'admin' : 'user'
      });
    }

    const isValid = (isAdmin && tabContext === 'admin') || 
                   (!isAdmin && tabContext === 'user');

    res.status(isValid ? 200 : 403).json({
      valid: isValid,
      requiredContext: isAdmin ? 'admin' : 'user',
      currentContext: tabContext,
      message: isValid 
        ? 'Context is valid'
        : `Please use the ${isAdmin ? 'admin' : 'user'} interface`
    });
  }
);

module.exports = router;
