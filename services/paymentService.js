const axios = require('axios');
require('dotenv').config();

// 아임포트 API 키와 시크릿
// const { IMP_KEY, IMP_SECRET } = process.env;

const IMP_KEY = process.env.IMP_TEST_KEY || "imp_apikey"; // 테스트용 기본 키
const IMP_SECRET = process.env.IMP_TEST_SECRET || "ekKoeWjWZ3f7G7r"; // 테스트용 기본 시크릿

// 아임포트 Access Token 발급
const getAccessToken = async () => {
  const response = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: IMP_KEY,
    imp_secret: IMP_SECRET,
  });

  return response.data.response.access_token;
};

// 결제 생성
const createPayment = async ({ amount, buyer_name, buyer_email, buyer_tel, item_name }) => {
  const merchant_uid = `mid_${new Date().getTime()}`; // 주문번호 생성

  const paymentData = {
    pg: "html5_inicis", // 테스트 PG 설정 - kakaopay 등
    pay_method: "card", // 결제 수단
    merchant_uid,
    amount,
    name: item_name,
    buyer_name,
    buyer_email,
    buyer_tel,
  };

  return { merchant_uid, paymentData }; // 결제 데이터를 반환
};

// 결제 검증
const validatePayment = async ({ imp_uid, merchant_uid, amount }) => {
  const accessToken = await getAccessToken();

  // 아임포트에서 결제 정보 가져오기
  const response = await axios.get(`https://api.iamport.kr/payments/${imp_uid}`, {
    headers: { Authorization: accessToken },
  });

  const paymentInfo = response.data.response;

  // 금액 검증
  if (paymentInfo.amount === amount && paymentInfo.merchant_uid === merchant_uid) {
    return true;
  } else {
    return false;
  }
};

module.exports = { createPayment, validatePayment };