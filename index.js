require("dotenv").config(); // โหลดตัวแปรสภาพแวดล้อมจากไฟล์ .env
const restify = require("restify");
const { BotFrameworkAdapter, ActivityHandler } = require("botbuilder");
const { MongoClient } = require("mongodb"); // อิมพอร์ต MongoClient
const { findURLsWithKeywords } = require("./searchKeywords.js"); // ฟังก์ชันค้นหา URL ตามคำหลัก
const { FAQHandler } = require("./faqHandler.js");
const { UnansweredQuestionHandler } = require("./unansweredQuestionHandler.js");
const { connectToDatabase } = require("./database.js");

// การตั้งค่า MongoDB
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const server = restify.createServer();
const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword,
});

class UniversityBot extends ActivityHandler {
  constructor() {
    super();
    this.faqHandler = new FAQHandler(); // จัดการกับคำถาม FAQs
    this.unansweredHandler = new UnansweredQuestionHandler(); // จัดการกับคำถามที่ยังไม่มีคำตอบ

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(
            "สวัสดี! ฉันสามารถช่วยให้ข้อมูลเกี่ยวกับการลงทะเบียน, กิจกรรมมหาวิทยาลัย, หรือบริการสุขภาพนักศึกษา. หากมีข้อสงสัยเบื้องต้น ท่านสามารถใช้คีย์เวิร์ดในการค้นหาคำ หรือใช้คำสั่ง 'Show FAQs' ได้"
          );
        }
      }
      await next();
    });

    this.onMessage(async (context, next) => {
      const text = context.activity.text.trim().toLowerCase(); // ข้อความที่ได้รับ
      const keywords = text.split(" "); // แยกคำหลักตามคำที่ได้รับ

      const matchingURLs = await findURLsWithKeywords(keywords); // ค้นหา URL ตามคำหลัก
      let response = "ไม่พบ URL ที่เกี่ยวข้องกับคำค้นของคุณ.";

      if (matchingURLs.length > 0) {
        response = "URLs ที่เกี่ยวข้อง:\n"; // แสดง URL ที่เกี่ยวข้อง
        matchingURLs.forEach((url) => {
          response += `${url}\n`; // เพิ่ม URL ในคำตอบ
        });
      }

      await context.sendActivity(response); // ส่งคำตอบกลับ
      await next();
    });
  }
}

server.listen(process.env.PORT || 3978, async function () {
  console.log(`${server.name} listening to ${server.url}`);
  await connectToDatabase(); // เชื่อมต่อกับ MongoDB
});

server.post("/api/messages", async (req, res) => {
  try {
    await adapter.processActivity(req, res, async (context) => {
      const bot = new UniversityBot();
      await bot.run(context);
    });
  } catch (error) {
    console.error("Error handling message:", error);
    res
      .status(500)
      .send({ error: "เกิดข้อผิดพลาดระหว่างการประมวลผลข้อความของคุณ." });
  }
});

module.exports = { UniversityBot }; // ส่งออกคลาสแชทบอท
