const express = require('express');
const router = express.Router();
const upload = require('../utils/multer')
const { isAuthenticatedUser } = require('../middlewares/auth');


const { registerUser, loginUser, updateUser, deactivateUser, getCustomerProfile, 
    updateUserRole, updateUserStatus, getAllUsers, getSingleUser, createAdmin } = require('../controllers/user')

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/update-profile', upload.single('image'), updateUser)
router.delete('/deactivate', deactivateUser)
router.get('/customers/:userId', getCustomerProfile);

router.get('/users', getAllUsers);
router.get('/users/:id', getSingleUser);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.post('/admin', createAdmin);


module.exports = router