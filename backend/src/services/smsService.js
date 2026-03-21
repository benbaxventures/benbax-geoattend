const axios = require('axios');

// SMS provider configuration
// Supports: Hubtel, Arkesel, or any HTTP-based SMS API used in Ghana
// Set SMS_PROVIDER, SMS_API_KEY, SMS_SENDER_ID in your .env

const sendSMS = async (to, message) => {
  const provider = process.env.SMS_PROVIDER || 'none';
  const apiKey = process.env.SMS_API_KEY;
  const senderId = process.env.SMS_SENDER_ID || 'GeoAttend';

  if (provider === 'none' || !apiKey) {
    console.log(`[SMS MOCK] To: ${to} | Message: ${message}`);
    return { success: true, mock: true };
  }

  try {
    if (provider === 'arkesel') {
      // Arkesel SMS API (popular in Ghana)
      await axios.post('https://sms.arkesel.com/api/v2/sms/send', {
        sender: senderId,
        message,
        recipients: [to],
      }, {
        headers: { 'api-key': apiKey },
      });
    } else if (provider === 'hubtel') {
      // Hubtel SMS API
      await axios.get(`https://smsc.hubtel.com/v1/messages/send`, {
        params: { From: senderId, To: to, Content: message },
        auth: { username: process.env.SMS_CLIENT_ID, password: apiKey },
      });
    }

    return { success: true };
  } catch (err) {
    console.error('SMS send error:', err.message);
    return { success: false, error: err.message };
  }
};

const sendCheckInReminder = async (phone, name) => {
  return sendSMS(phone, `Hi ${name}, this is a reminder to check in at work today. - GeoAttend`);
};

const sendLateAlert = async (phone, name, time) => {
  return sendSMS(phone, `${name}, you checked in late today at ${time}. Please ensure punctuality. - GeoAttend`);
};

const sendAbsentAlert = async (phone, name, date) => {
  return sendSMS(phone, `${name}, you were absent on ${date}. If this is an error, please contact your admin. - GeoAttend`);
};

module.exports = { sendSMS, sendCheckInReminder, sendLateAlert, sendAbsentAlert };
