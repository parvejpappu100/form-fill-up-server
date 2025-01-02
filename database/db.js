require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fdnsrak.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connect() {
  await client.connect();
}

function getStudentsData() {
  return client.db("form-fill-up").collection("studentsData");
}

function usersCollection() {
  return client.db("form-fill-up").collection("users");
}

function studentsData() {
  return client.db("form-fill-up").collection("studentsData");
};

function paymentsCollection(){
  return client.db("form-fill-up").collection("paymentsCollection");
}

module.exports = {
  connect,
  getStudentsData,
  usersCollection,
  studentsData,
  paymentsCollection
};
