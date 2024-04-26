const { getFAQs, searchFAQs } = require("./database.js");

class FAQHandler {
  async handleMessage(context, text) {
    if (text === "show faqs") {
      // ตรวจสอบคำสั่ง 'show faqs'
      const faqs = await getFAQs(); // เรียกใช้ getFAQs
      if (faqs.length > 0) {
        let response = "FAQs:\n\n";
        faqs.forEach((faq, index) => {
          response += `${index + 1}. Q: ${faq.question}\nA: ${faq.answer}\n\n`;
        });
        await context.sendActivity(response);
      } else {
        await context.sendActivity("ไม่มี FAQs ในขณะนี้.");
      }
    } else {
      const faqResults = await searchFAQs(text); // เรียกใช้ searchFAQs
      if (faqResults.length > 0) {
        const selectedFAQ = faqResults[0];
        await context.sendActivity(
          `Q: ${selectedFAQ.question}\nA: ${selectedFAQ.answer}`
        );
      } else {
        await context.sendActivity("ไม่พบคำตอบที่เกี่ยวข้อง");
      }
    }
  }
}

module.exports = { FAQHandler };
