const { MongoClient } = require("mongodb");
let db;

async function connectToDatabase(uri) {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    db = client.db("projectCPE");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Could not connect to MongoDB:", error);
  }
}

async function getFAQs() {
  try {
    return await db.collection("FAQs").find({}).toArray();
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return [];
  }
}

module.exports = { connectToDatabase, getFAQs };
