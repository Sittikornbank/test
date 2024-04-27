require("dotenv").config(); // โหลดตัวแปรสภาพแวดล้อมจากไฟล์ .env
const axios = require("axios"); // สำหรับการร้องขอ HTTP
const cheerio = require("cheerio"); // สำหรับการวิเคราะห์ HTML
const { MongoClient } = require("mongodb"); // สำหรับการเชื่อมต่อกับ MongoDB

const uri = process.env.MONGODB_URI; // URI ของ MongoDB
const client = new MongoClient(uri);

async function scrapeAndStoreURLs(url, depth = 1) {
  if (depth < 0) {
    return; // หยุดการสแครปปิ้งหากถึงความลึกสูงสุด
  }

  try {
    const response = await axios.get(url); // ดึงหน้าเว็บ
    const $ = cheerio.load(response.data);

    const urls = new Set(); // เก็บ URL โดยไม่ซ้ำ
    $("a").each((index, element) => {
      const link = $(element).attr("href");
      if (link && !urls.has(link)) {
        urls.add(link); // เก็บ URL จากลิงก์
      }
    });

    await client.connect(); // เชื่อมต่อกับ MongoDB
    const database = client.db("projectCPE");
    const urlsCollection = database.collection("URLs");

    await urlsCollection.insertMany(
      Array.from(urls).map((link) => ({ url: link }))
    ); // เก็บ URL ใน MongoDB

    // สแครปปิ้งจากลิงก์ที่เก็บได้
    for (const link of urls) {
      await scrapeAndStoreURLs(link, depth - 1); // สแครปปิ้งลิงก์อื่น
    }
  } catch (error) {
    console.error(`Error scraping ${url}:`, error); // จัดการข้อผิดพลาด
  } finally {
    await client.close(); // ปิดการเชื่อมต่อ
  }
}

module.exports = { scrapeAndStoreURLs }; // ส่งออกฟังก์ชัน
