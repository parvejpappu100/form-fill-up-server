const express = require("express");
const db = require("./database/db");
const { ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const body_parser = require("body-parser");
const app = express();
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;

// * Middleware:
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(body_parser.json());

// * Connect With mongoDb:
db.connect();
app.use("/api", require("./routes/routes"));

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: "unauthorize access" });
  }

  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorize access" });
    }
    req.decoded = decoded;
    next();
  });
};

// * JWT:
app.post("/jwt", (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  res.send({ token });
});

// * Verify admin:
const verifyAdmin = async (req, res, next) => {
  const email = req.decoded.email;
  const usersCollection = db.usersCollection();
  const query = { email: email };
  const user = await usersCollection.findOne(query);
  if (user?.role !== "admin") {
    return res.status(403).send({ error: true, message: "forbidden message" });
  }
  next();
};

// * To get all users api:
app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
  const usersCollection = db.usersCollection();
  const result = await usersCollection.find().toArray();
  res.send(result);
});

// * CHECK ADMIN OR  NOT:
app.get("/users/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
  const email = req.params.email;
  const usersCollection = db.usersCollection();

  if (req.decoded.email !== email) {
    return res.send({ admin: false });
  }
  const query = { email: email };
  const user = await usersCollection.findOne(query);
  const result = { admin: user?.role === "admin" };
  res.send(result);
});

// * SAVED USER:
app.post("/users", async (req, res) => {
  const user = req.body;

  const query = { email: user.email };
  const usersCollection = db.usersCollection();
  const existingUser = await usersCollection.findOne(query);
  if (existingUser) {
    return res.send({ message: "User already exist" });
  }

  const result = await usersCollection.insertOne(user);
  res.send(result);
});

// * UPDATE USER ROLE:
app.put("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedRole = req.body;
  const setNewRole = {
    $set: {
      role: updatedRole.role,
    },
  };
  const usersCollection = db.usersCollection();
  const result = await usersCollection.updateOne(filter, setNewRole, options);
  res.send(result);
});

// * Delete User:
app.delete("/delete-user/:id", verifyJWT, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const usersCollection = db.usersCollection();
  const result = await usersCollection.deleteOne(query);
  res.send(result);
});

// * Get All Students Data:
// * To get all users api:
app.get("/allStudents", async (req, res) => {
  const search = req.query.search;
  const numericSearch = parseInt(search) || search;
  const query = {
    $or: [
      { phone: { $regex: search, $options: "i" } },
      { board_roll: { $regex: search, $options: "i" } },
      { registration: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { semester: { $regex: search, $options: "i" } },
      { shift: { $regex: search, $options: "i" } },
      { session: { $regex: search, $options: "i" } },
    ],
  };

  const studentsData = db.studentsData();
  const result = await studentsData.find(query).toArray();
  res.send(result);
});

// * all Students:
app.get("/students",  async (req, res) => {
  const studentsData = db.studentsData();
  const result = await studentsData.find().toArray();
  res.send(result);
});

// * Add new Students:
app.post("/addStudent", verifyJWT, verifyAdmin, async (req, res) => {
  const newStudent = req.body;
  const studentsData = db.studentsData();
  const result = await studentsData.insertOne(newStudent);
  res.send(result);
});

// * To update student data:
app.put("/updateStudent/:id", verifyJWT, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updateStudent = req.body;
  const setNewStudent = {
    $set: {
      name: updateStudent.name,
      father_name: updateStudent.father_name,
      mother_name: updateStudent.mother_name,
      board_roll: updateStudent.board_roll,
      registration: updateStudent.registration,
      semester: updateStudent.semester,
      session: updateStudent.session,
      regulation: updateStudent.regulation,
      section: updateStudent.section,
      shift: updateStudent.shift,
      phone: updateStudent.phone,
      image: updateStudent.image,
    },
  };
  const studentsData = db.studentsData();
  const result = await studentsData.updateOne(filter, setNewStudent, options);
  res.send(result);
});

// * To delete single student data:
app.delete("/deleteStudent/:id", verifyJWT, verifyAdmin, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const studentsData = db.studentsData();
  const result = await studentsData.deleteOne(query);
  res.send(result);
});

// * Search :
app.get("/search-student", async (req, res) => {
  const search = req.query.search;
  const query = { board_roll: { $regex: search, $options: "i" } };
  const studentsCollection = db.studentsData();
  const result = await studentsCollection.find(query).toArray();
  res.send(result);
});

// * GET PAYMENT COLLECTION DATA:
app.get("/payment-data",  async (req, res) => {
  const paymentsCollection = db.paymentsCollection();
  const result = await paymentsCollection.find().toArray();
  res.send(result);
});

// // * Search Admit Card:
// app.get("/search-admit-card", async (req, res) => {
//   const search = req.query.search;
//   const query = { board_roll: { $regex: search, $options: "i" } };
//   const paymentsCollection = db.paymentsCollection();
//   const result = await paymentsCollection.find(query).toArray();
//   res.send(result);
// });

app.get("/", (req, res) => {
  res.send("form fil up server is running");
});

app.listen(port, () => {
  console.log(`form fil up server is running on port : ${port}`);
});
