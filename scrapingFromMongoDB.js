// const axios = require("axios"); // สำหรับการร้องขอ HTTP
// const { MongoClient } = require("mongodb"); // สำหรับการเชื่อมต่อกับ MongoDB

// async function scrapeFromMongoDB() {
//   const uri = process.env.MONGODB_URI;
//   const client = new MongoClient(uri);

//   try {
//     await client.connect(); // เชื่อมต่อกับ MongoDB
//     const database = client.db("projectCPE"); // เลือกฐานข้อมูล
//     const urlsCollection = database.collection("URLs"); // เลือก Collection ที่เก็บ URL

//     // ดึง URL จาก MongoDB
//     const urls = await urlsCollection.find({}).toArray();

//     // ทำการสแครปปิ้งพร้อมกัน
//     const scrapingPromises = urls.map((url) => axios.get(url.url));
//     const responses = await Promise.all(scrapingPromises);

//     // ประมวลผลข้อมูลที่สแครปปิ้งได้
//     responses.forEach((response, index) => {
//       console.log(`Data from URL ${urls[index].url}:`, response.data);
//     });
//   } catch (error) {
//     console.error("Error in scraping:", error);
//   } finally {
//     client.close(); // ปิดการเชื่อมต่อ
//   }
// }

// scrapeFromMongoDB(); // สแครปปิ้งจาก URL ที่เก็บไว้ใน MongoDB
