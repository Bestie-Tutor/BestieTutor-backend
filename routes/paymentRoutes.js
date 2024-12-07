const express = require('express');
const router = express.Router();
const { requestPayment, verifyPayment } = require('../controllers/paymentController');

// 결제 요청
router.post('/request', requestPayment);

// 결제 검증
router.post('/verify', verifyPayment);

module.exports = router;