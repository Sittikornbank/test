const { getFAQs, searchFAQs } = require("./database.js"); // ฟังก์ชันสำหรับจัดการกับ FAQs

class FAQHandler {
  async handleMessage(context, text) {
    if (text === "show faqs") { // หากผู้ใช้ขอแสดง FAQs
      const faqs = await getFAQs(); // ดึงข้อมูล FAQs
      if (faqs && faqs.length > 0) { // ตรวจสอบว่ามีค่าหรือไม่
        let response = "FAQs:\n\n";
        faqs.forEach((faq, index) => {
          response += `${index + 1}. Q: ${faq.question}\nA: ${faq.answer}\n\n`;
        });
        await context.sendActivity(response);
      } else {
        await context.sendActivity("ไม่มี FAQs ในขณะนี้."); // กรณีไม่มีคำถามใน FAQs
      }
    } else {
      const faqResults = await searchFAQs(text); // ค้นหาใน FAQs ตามข้อความที่ได้รับ
      if (faqResults && faqResults.length > 0) {
        const selectedFAQ = faqResults[0]; // เลือกคำถามที่เกี่ยวข้อง
        await context.sendActivity(
          `Q: ${selectedFAQ.question}\nA: ${selectedFAQ.answer}`
        );
      } else {
        await context.sendActivity("ไม่พบคำตอบที่เกี่ยวข้อง."); // หากไม่มีคำตอบที่เกี่ยวข้อง
      }
    }
  }
}

module.exports = { FAQHandler }; // ส่งออกคลาส FAQHandler
