const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
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
    return await faqsCollection.find({}).toArray();
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return [];
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

async function saveUnansweredQuestion(question) {
  try {
    const unansweredQuestionsCollection = client.db("projectCPE").collection("UnansweredQuestions");
    await unansweredQuestionsCollection.insertOne({ question });
    console.log("Saved unanswered question");
  } catch (error) {
    console.error("Error saving unanswered question:", error);
  }
}

module.exports = { connectToDatabase, getFAQs, searchFAQs, saveUnansweredQuestion };
