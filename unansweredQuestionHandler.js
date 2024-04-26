const { searchFAQs, saveUnansweredQuestion } = require("./database.js");

class UnansweredQuestionHandler {
  async handleMessage(context, text) {
    const faqResults = await searchFAQs(text);
    if (faqResults.length === 0) {
      await saveUnansweredQuestion(text);
      await context.sendActivity("ไม่พบคำตอบสำหรับคำถามของคุณในขณะนี้");
    }
  }
}

module.exports = { UnansweredQuestionHandler }; // ตรวจสอบการส่งออก
