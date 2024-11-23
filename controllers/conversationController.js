const axios = require('axios');
const conversationService = require('../services/conversationService');
const Topic = require('../models/Topic');
const Character = require('../models/Character');
const Conversation = require('../models/Conversation');

// 대화 기록 조회
exports.getConversationHistory = async (req, res) => {
    try {
        const { email } = req.params;

        // 대화 데이터 조회
        const conversations = await Conversation.find({ email }).sort({ start_time: -1 });
        if (conversations.length === 0) {
            return res.status(404).json({ message: '해당 사용자의 대화를 찾을 수 없습니다.' });
        }

        // 각 대화에 포함된 메시지와 피드백 데이터 추가
        const conversationDetails = await Promise.all(
            conversations.map(async (conversation) => {
                const messages = await Message.find({ converse_id: conversation._id }).sort({ input_date: 1 });
                const feedbacks = await Feedback.find({ converse_id: conversation._id });

                return {
                    conversationId: conversation._id,
                    topicDescription: conversation.topic_description,
                    startTime: conversation.start_time,
                    endTime: conversation.end_time,
                    messages: messages.map(message => ({
                        messageId: message.message_id,
                        content: message.message,
                        type: message.message_type,
                        inputDate: message.input_date
                    })),
                    feedbacks: feedbacks.map(feedback => ({
                        feedbackId: feedback._id,
                        messageId: feedback.message_id,
                        content: feedback.feedback,
                        startTime: feedback.start_time
                    }))
                };
            })
        );

        res.status(200).json({ conversations: conversationDetails });
    } catch (error) {
        console.error('대화 기록 조회 중 에러:', error);
        res.status(500).json({ message: '대화 기록 조회 중 에러' });
    }
};

exports.addUserMessage = async (req, res) => {
    try {
        // 사용자 정보 가져오기
        const profileResponse = await axios.get('http://localhost:3000/user/profile', {
            headers: {
                Authorization: `Bearer ${req.cookies.token || req.headers['authorization']}` // 토큰 전달
            }
        });

        const { text, conversationHistory, mainTopic, subTopic, difficulty, characterName } = req.body;

        // 요청 데이터 검증
        if (!text || !Array.isArray(conversationHistory)) {
            return res.status(400).json({ message: "text 또는 conversationHistory가 잘못되었습니다." });
        }

        // 대주제 및 소주제 검증
        const topic = await Topic.findOne({ mainTopic, 'subTopics.name': subTopic });
        if (!topic) {
            return res.status(400).json({ message: '잘못된 mainTopic 또는 subTopic입니다.' });
        }

        const subTopicData = topic.subTopics.find(st => st.name === subTopic);
        const difficultyData = subTopicData.difficulties.find(d => d.difficulty === difficulty);
        if (!difficultyData) {
            return res.status(400).json({ message: '잘못된 난이도입니다.' });
        }

        // 캐릭터 검증
        const character = await Character.findOne({ name: characterName });
        if (!character) {
            return res.status(400).json({ message: '잘못된 캐릭터 이름입니다.' });
        }

        // 새 대화 생성 또는 기존 대화 재사용
        let conversationId = req.body.converseId;
        if (!conversationId) {
            const conversationData = await conversationService.createNewConversation({
                email: profileResponse.data.email,
                mainTopic,
                subTopic,
                difficulty,
                characterName
            });
            conversationId = conversationData.conversationId;
        }

        const { messageId } = await conversationService.addUserMessage(text, conversationId);
        await conversationService.generateFeedbackForMessage(messageId, text);

        res.set('Content-Type', 'application/json');
        res.json({ messageId });
    } catch (error) {
        console.error('사용자 메시지 등록 중 에러:', error);
        res.status(500).json({ message: '사용자 메시지 등록 중 에러' });
    }
}

// GPT 응답
exports.getResponse = async (req, res) => {
    try {
        // 사용자 정보 가져오기
        const profileResponse = await axios.get('http://localhost:3000/user/profile', {
            headers: {
                Authorization: `Bearer ${req.cookies.token || req.headers['authorization']}` // 토큰 전달
            }
        });

        const { text, conversationHistory, mainTopic, subTopic, difficulty, characterName } = req.body;

        // 요청 데이터 검증
        if (!text || !Array.isArray(conversationHistory)) {
            return res.status(400).json({ message: "text 또는 conversationHistory가 잘못되었습니다." });
        }

        // 대주제 및 소주제 검증
        const topic = await Topic.findOne({ mainTopic, 'subTopics.name': subTopic });
        if (!topic) {
            return res.status(400).json({ message: '잘못된 mainTopic 또는 subTopic입니다.' });
        }

        const subTopicData = topic.subTopics.find(st => st.name === subTopic);
        const difficultyData = subTopicData.difficulties.find(d => d.difficulty === difficulty);
        if (!difficultyData) {
            return res.status(400).json({ message: '잘못된 난이도입니다.' });
        }

        // 캐릭터 검증
        const character = await Character.findOne({ name: characterName });
        if (!character) {
            return res.status(400).json({ message: '잘못된 캐릭터 이름입니다.' });
        }

        // 새 대화 생성 또는 기존 대화 재사용
        let conversationId = req.body.converseId;
        if (!conversationId) {
            const conversationData = await conversationService.createNewConversation({
                email: profileResponse.data.email,
                mainTopic,
                subTopic,
                difficulty,
                characterName
            });
            conversationId = conversationData.conversationId;
        }

        // GPT 응답 생성
        const { gptResponse } = await conversationService.GPTResponse(text, conversationId);
        console.log("Generated gptResponse:", gptResponse);

        // TTS 변환 후 텍스트와 음성 데이터 함께 응답
        const audioBuffer = await conversationService.generateTTS(gptResponse);
        res.set('Content-Type', 'application/json');
        res.json({ gptResponse, audio: audioBuffer.toString('base64') });
    } catch (error) {
        console.error('대화 중 에러:', error);
        res.status(500).json({ message: '대화 중 에러' });
    }
};