require("dotenv").config();
const restify = require("restify");
const { BotFrameworkAdapter, ActivityHandler } = require("botbuilder");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const { connectToDatabase, getFAQs } = require("./database");

// MongoDB connection
const uri = process.env.MONGODB_URI;
connectToDatabase(uri);

const server = restify.createServer();
const adapter = new BotFrameworkAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword,
});

class UniversityBot extends ActivityHandler {
  constructor() {
    super();
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity("Welcome!");
        }
      }
      await next();
    });

    this.onMessage(async (context, next) => {
      const text = context.activity.text.trim().toLowerCase();

      if (text === "show faqs") {
        const faqs = await getFAQs();
        if (faqs && faqs.length > 0) {
          const response = faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join("\n\n");
          await context.sendActivity(response);
        } else {
          await context.sendActivity("No FAQs available.");
        }
      } else {
        if (text.startsWith("สภาพอากาศ")) {
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
          await context.sendActivity(
            "ฉันไม่เข้าใจคำถามของคุณ กรุณาลองคำถามอื่น"
          );
        }
      }
      await next();
    });
  }
}

async function getWeather(city) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${apiKey}&units=metric`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.main
      ? `ใน ${city}, อุณหภูมิคือ ${data.main.temp}°C, สภาพอากาศคือ ${data.weather[0].description}.`
      : "ไม่พบข้อมูลสภาพอากาศ.";
  } catch (error) {
    console.error("Error:", error);
    return "เกิดข้อผิดพลาดในการเรียกข้อมูลสภาพอากาศ.";
  }
}

server.listen(process.env.PORT || 3978, function () {
  console.log(`${server.name} listening to ${server.url}`);
});

server.post("/api/messages", (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    await new UniversityBot().run(context);
  });
});