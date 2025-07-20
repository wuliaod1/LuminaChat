const express = require('express');
const { register, login, deactivateAccount } = require('../controllers/auth.controller');
const { validateRegistration } = require('../middleware/validation.middleware');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', validateRegistration, register);
router.post('/login', login);
router.delete('/deactivate', protect, deactivateAccount);

module.exports = router;
