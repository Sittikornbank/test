require("dotenv").config();
const restify = require("restify");
const { BotFrameworkAdapter, ActivityHandler } = require("botbuilder");
const { MongoClient } = require("mongodb");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

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
    // ส่วนต้อนรับสมาชิกใหม่
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity("สวัสดี! ฉันสามารถช่วยให้ข้อมูลเกี่ยวกับการลงทะเบียน, กิจกรรมมหาวิทยาลัย, หรือบริการสุขภาพนักศึกษา. คุณต้องการทราบข้อมูลเรื่องใด? สามารถใช้คำสั่ง Show FAQS");
        }
      }
      await next();
    });

    // ส่วนจัดการข้อความ
    this.onMessage(async (context, next) => {
      const text = context.activity.text.trim().toLowerCase();

      if (text === "show faqs") {
        const faqs = await getFAQs();
        if (faqs.length > 0) {
          const response = faqs
            .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
            .join("\n\n");
          await context.sendActivity(response);
        } else {
          await context.sendActivity("No FAQs available.");
        }
      } else {
        // ส่วนจัดการข้อความต่างๆ
        // ตรวจสอบและจัดการข้อความ "สภาพอากาศ"
        if (text.startsWith("สภาพอากาศ")) {
          // ตัดคำว่า "สภาพอากาศ " ออกและใช้สิ่งที่เหลือเป็นข้อมูลสำหรับ API
          const query = text.substring("สภาพอากาศ ".length);
          if (query) {
            const weatherResponse = await getWeather(query);
            await context.sendActivity(weatherResponse);
          } else {
            await context.sendActivity(
              'กรุณาระบุชื่อเมือง เช่น "สภาพอากาศ Bangkok, TH"'
            );
          }
        } else {
          // ส่วนตอบกลับคำถามอื่นๆ
          await context.sendActivity(
            "ฉันเสียใจ ท่านสามารถกลับเข้ามาสอบถามใหม่ในภายหลังจากที่เราอัพเดตข้อมูล"
          );
        }
      }
      await next();
    });
  }
}

// ฟังก์ชั่นเรียกข้อมูลสภาพอากาศ
async function getWeather(city) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data && data.main && data.weather) {
      return `ใน ${city}, อุณหภูมิคือ ${data.main.temp}°C, สภาพอากาศคือ ${data.weather[0].description}.`;
    } else {
      return `ไม่พบข้อมูลสภาพอากาศสำหรับ ${city}.`;
    }
  } catch (error) {
    console.error("Error:", error);
    return `เกิดข้อผิดพลาดในการเรียกข้อมูลสภาพอากาศสำหรับ ${city}.`;
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
    console.error('Error handling message:', error);
    res.status(500).send({ error: 'An error occurred while handling your request.' });
  }
});

