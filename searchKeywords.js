const { MongoClient } = require("mongodb");
const axios = require("axios");
const cheerio = require("cheerio");

async function findURLsWithKeywords(keywords) {
  const client = new MongoClient(process.env.MONGODB_URI); // เชื่อมต่อกับ MongoDB
  const matchingURLs = [];

  try {
    await client.connect(); // เชื่อมต่อกับ MongoDB
    const database = client.db("projectCPE");
    const urlsCollection = database.collection("URLs");

    const urls = await urlsCollection.find({}).toArray(); // ดึง URL ที่เก็บไว้

    // ค้นหา URL ที่มีคำหลัก
    for (const { url } of urls) {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const textContent = $("body").text();

      for (const keyword of keywords) {
        if (textContent.includes(keyword)) {
          matchingURLs.push(url); // เก็บ URL ที่มีคำหลัก
          break; // หลีกเลี่ยงการเพิ่ม URL ซ้ำ
        }
      }
    }
  } catch (error) {
    console.error("Error finding URLs with keywords:", error);
  } finally {
    client.close(); // ปิดการเชื่อมต่อ
  }

  return matchingURLs; // ส่งคืน URL ที่เกี่ยวข้อง
}

module.exports = { findURLsWithKeywords }; // ส่งออกฟังก์ชัน
