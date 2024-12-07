const { createPayment, validatePayment } = require('../services/paymentService');

// 결제 요청 처리
const requestPayment = async (req, res) => {
  const { amount, buyer_name, buyer_email, buyer_tel, item_name } = req.body;

  try {
    const paymentData = await createPayment({ amount, buyer_name, buyer_email, buyer_tel, item_name });
    res.status(200).json(paymentData);
  } catch (error) {
    console.error('결제 요청 오류:', error);
    res.status(500).json({ message: '결제 요청에 실패했습니다.', error: error.message });
  }
};

// 결제 검증 처리
const verifyPayment = async (req, res) => {
  const { imp_uid, merchant_uid, amount } = req.body;

  try {
    const isValid = await validatePayment({ imp_uid, merchant_uid, amount });
    if (isValid) {
      res.status(200).json({ message: '결제 검증 성공' });
    } else {
      res.status(400).json({ message: '결제 검증 실패: 금액 불일치' });
    }
  } catch (error) {
    console.error('결제 검증 오류:', error);
    res.status(500).json({ message: '결제 검증에 실패했습니다.', error: error.message });
  }
};

module.exports = { requestPayment, verifyPayment };