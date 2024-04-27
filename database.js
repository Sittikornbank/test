const { MongoClient } = require("mongodb"); // อิมพอร์ต MongoClient

const uri = process.env.MONGODB_URI; // URI ของ MongoDB
const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect(); // เชื่อมต่อกับ MongoDB
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Could not connect to MongoDB:", error);
    throw new Error("Database connection error");
  }
}

async function getFAQs() {
  try {
    const database = client.db("projectCPE");
    const faqsCollection = database.collection("FAQs");
    return await faqsCollection.find({}).toArray(); // ดึงข้อมูลทั้งหมดใน FAQs
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return [];
  }
}

async function searchFAQs(question) {
  try {
    const database = client.db("projectCPE");
    const faqsCollection = database.collection("FAQs");
    const results = await faqsCollection
      .find({ question: { $regex: question, $options: "i" } })
      .toArray(); // ค้นหา FAQs ตามข้อความที่ได้รับ
    return results.map((result) => ({
      question: result.question,
      answer: result.answer,
    }));
  } catch (error) {
    console.error("Error searching FAQs:", error);
    return [];
  }
}

async function saveUnansweredQuestion(question) {
  try {
    const unansweredQuestionsCollection = client
      .db("projectCPE")
      .collection("UnansweredQuestions");
    await unansweredQuestionsCollection.insertOne({ question }); // เก็บคำถามที่ยังไม่มีคำตอบ
    console.log("Saved unanswered question");
  } catch (error) {
    console.error("Error saving unanswered question:", error);
  }
}

module.exports = {
  connectToDatabase,
  getFAQs,
  searchFAQs,
  saveUnansweredQuestion,
}; // ส่งออกฟังก์ชัน
