require("dotenv").config();
const restify = require("restify");
const { BotFrameworkAdapter, ActivityHandler } = require("botbuilder");
const { MongoClient } = require("mongodb");
const { FAQHandler } = require("./faqHandler.js");
const { UnansweredQuestionHandler } = require("./unansweredQuestionHandler.js");
const { connectToDatabase } = require("./database.js");

// MongoDB connection
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
    this.faqHandler = new FAQHandler();
    this.unansweredHandler = new UnansweredQuestionHandler();

    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(
            "สวัสดี! ฉันสามารถช่วยให้ข้อมูลเกี่ยวกับการลงทะเบียน, กิจกรรมมหาวิทยาลัย, หรือบริการสุขภาพนักศึกษา. คุณต้องการทราบข้อมูลเรื่องใด? หากมีข้อสงสัยเบื้องต้นท่านสามารถใช้คีย์เวิร์ดในการค้นหาคำหรือใช้คำสั่ง 'Show FAQs' ได้"
          );
        }
      }
      await next();
    });

    this.onMessage(async (context, next) => {
      const text = context.activity.text.trim().toLowerCase();
      console.log("Received message:", text); // บันทึกข้อความที่ได้รับ

      // ใช้ FAQHandler และ UnansweredQuestionHandler เพื่อจัดการข้อความ
      await this.faqHandler.handleMessage(context, text);
      await this.unansweredHandler.handleMessage(context, text);

      await next();
    });
  }
}

server.listen(process.env.PORT || 3978, async function () {
  console.log(`${server.name} listening to ${server.url}`);
  await connectToDatabase();
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

module.exports = server;
