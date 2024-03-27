const { MongoClient } = require("mongodb");

// ตรวจสอบให้แน่ใจว่าคุณได้ระบุ MONGODB_URI ในไฟล์ .env ของคุณ
const uri = process.env.MONGODB_URI;

// สร้าง instance ของ MongoClient
const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    // ต่อกับ MongoDB
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Could not connect to MongoDB:", error);
  }
}

async function searchFAQ(question) {
  try {
    const database = client.db("projectCPE");
    const faqsCollection = database.collection("FAQs");

    // ค้นหาข้อมูลตามคำถามโดยใช้ Regular Expression เพื่อให้ค้นหาได้แม้ว่าจะไม่ตรงตามข้อความแบบเต็ม
    const result = await faqsCollection.findOne({ question: { $regex: question, $options: 'i' } });

    if (result) {
      // ถ้าพบคำถามที่ใกล้เคียงกัน
      return { question: result.question, answer: result.answer };
    } else {
      // ถ้าไม่พบคำถามที่ใกล้เคียงกัน
      return null;
    }
  } catch (error) {
    console.error("Error searching FAQs:", error);
    return null;
  }
}

module.exports = { connectToDatabase, searchFAQ };
