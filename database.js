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

async function searchFAQs(question) {
  try {
    const database = client.db("projectCPE");
    const faqsCollection = database.collection("FAQs");
    const results = await faqsCollection.find({ question: { $regex: question, $options: 'i' } }).toArray();
    return results.map(result => ({ question: result.question, answer: result.answer }));
  } catch (error) {
    console.error("Error searching FAQs:", error);
    return [];
  }
}

module.exports = { connectToDatabase, searchFAQs };
