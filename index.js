require("dotenv").config();
const restify = require("restify");
const { BotFrameworkAdapter, ActivityHandler } = require("botbuilder");
const { MongoClient } = require("mongodb");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { searchFAQs } = require("./database.js"); // ตรวจสอบว่า path ถูกต้อง
const { parse } = require("dotenv");

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Could not connect to MongoDB:", error);
  }
}

async function getFAQs() {
  try {
    const database = client.db("projectCPE");
    const faqsCollection = database.collection("FAQs");
    return await faqsCollection.find({}).toArray();
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return [];
  }
}
const server = restify.createServer();
const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword,
});

class UniversityBot extends ActivityHandler {
  constructor() {
    super();
    this.lastFAQResults = []; //สำหรับเก็บคำถามล่าสุดของUser
    // ส่วนต้อนรับสมาชิกใหม่
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(
            "สวัสดี! ฉันสามารถช่วยให้ข้อมูลเกี่ยวกับการลงทะเบียน, กิจกรรมมหาวิทยาลัย, หรือบริการสุขภาพนักศึกษา. คุณต้องการทราบข้อมูลเรื่องใด? หากมีข้อสงสัยเบื้องต้นท่านสามารถใช้คีย์เวิร์ดในการค้นหาคำหรือใช้คำสั่ง 'Show FAQs'ได้"
          );
        }
      }
      await next();
    });

    // ส่วนจัดการข้อความ
    this.onMessage(async (context, next) => {
      const text = context.activity.text.trim().toLowerCase();

      // ตรวจสอบว่าข้อความเป็นตัวเลขเท่านั้น
      if (!isNaN(text) && parseInt(text) > 0) {
        const index = parseInt(text) - 1; // แปลงเป็น index ของอาร์เรย์
        if (index >= 0 && index < this.lastFAQResults.length) {
          const selectedFAQ = this.lastFAQResults[index];
          await context.sendActivity(
            `Q: ${selectedFAQ.question}\nA: ${selectedFAQ.answer}`
          );
        } else {
          await context.sendActivity("กรุณาพิมพ์หมายเลขที่ถูกต้องจากรายการ.");
        }
      } else if (text === "show faqs") {
        const faqs = await getFAQs();
        if (faqs.length > 0) {
          let response = "FAQs:\n\n";
          faqs.forEach((faq, index) => {
            response += `${index + 1}. Q: ${faq.question}\nA: ${
              faq.answer
            }\n\n`;
          });
          await context.sendActivity(response);
        } else {
          await context.sendActivity("ไม่มี FAQs ในขณะนี้.");
        }
      } else {
        const indexInput = text.match(/^\d+$/); // ตรวจสอบว่าเป็นตัวเลขเท่านั้น
        if (indexInput) {
          const index = parseInt(indexInput[0]) - 1;
          if (index >= 0 && index < this.lastFAQResults.length) {
            const selectedFAQ = this.lastFAQResults[index];
            await context.sendActivity(
              `Q: ${selectedFAQ.question}\nA: ${selectedFAQ.answer}`
            );
          } else {
            await context.sendActivity("กรุณาพิมพ์หมายเลขที่ถูกต้องจากรายการ.");
          }
        } else {
          const faqResults = await searchFAQs(text);
          if (faqResults.length > 0) {
            let response = "พบคำถามใกล้เคียงดังนี้:\n\n";
            faqResults.forEach((faq, index) => {
              response += `${index + 1}. ${faq.question}\n`;
            });
            response += "\nกรุณาพิมพ์หมายเลขเพื่อดูคำตอบ.";
            await context.sendActivity(response);
            this.lastFAQResults = faqResults; // บันทึกรายการคำถามล่าสุด
          } else {
            await context.sendActivity("ไม่พบคำถามที่ใกล้เคียงกับคำถามของคุณ.");
          }
        }
      }
      await next();
    });
  }
}

// สร้างและกำหนดค่าเซิร์ฟเวอร์

// ที่ส่วนการสร้าง server
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
      .send({ error: "An error occurred while handling your request." });
  }
});
