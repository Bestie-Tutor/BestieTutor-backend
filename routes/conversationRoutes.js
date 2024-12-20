const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');

router.post('/getResponse', conversationController.getResponse);

router.post('/initialize', conversationController.initializeConversation);

router.post('/addUserMessage', conversationController.addUserMessage);

router.get('/getConversationHistory/:email', conversationController.getConversationHistory);

router.get('/getConversationById/:converse_id', conversationController.getConversationById);

router.put('/updateEndTime', conversationController.updateEndTime);

router.get('/getAllLanguages', conversationController.getAllLanguages);

router.put('/handleLanguageChange', conversationController.handleLanguageChange);

router.get('/getRecentLanguage/:email', conversationController.getRecentLanguage);

module.exports = router;