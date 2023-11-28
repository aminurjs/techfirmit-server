const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.port || 5000;

//MiddleWare
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["https://hotelhube.web.app", "http://localhost:5173"],
    credentials: true,
  })
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sz2xe62.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//Collections
const servicesCollection = client.db("techFirmIT").collection("services");
const testimonialsCollection = client
  .db("techFirmIT")
  .collection("testimonials");
const employeesCollection = client.db("techFirmIT").collection("employees");

//Data get Functions
app.get("/api/v1/services", async (req, res) => {
  const services = await servicesCollection.find().toArray();
  res.send(services);
});
app.get("/api/v1/testimonials", async (req, res) => {
  const testimonials = await testimonialsCollection.find().toArray();
  res.send(testimonials);
});
app.get("/api/v1/employee-list", async (req, res) => {
  const query = { role: "employee" };
  const employeeList = await employeesCollection.find(query).toArray();
  res.send(employeeList);
});
app.get("/api/v1/all-employee", async (req, res) => {
  const query = { verified: true };
  const allEmployees = await employeesCollection.find(query).toArray();
  res.send(allEmployees);
});

app.get("/api/v1/details/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await employeesCollection.findOne(query);
  res.send(result);
});

//Data Post Functions
app.post("/api/v1/employees", async (req, res) => {
  const data = req.body;
  const result = await employeesCollection.insertOne(data);
  res.send(result);
});

//Data Post Functions
app.patch("/api/v1/employees/verified/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updateVerified = {
    $set: { verified: true },
  };
  const result = await employeesCollection.updateOne(query, updateVerified);
  res.send(result);
});
app.patch("/api/v1/update-role/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updateVerified = {
    $set: { role: "hr" },
  };
  const result = await employeesCollection.updateOne(query, updateVerified);
  res.send(result);
});
app.patch("/api/v1/employee/fire/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updateVerified = {
    $set: { role: "fired" },
  };
  const result = await employeesCollection.updateOne(query, updateVerified);
  res.send(result);
});

//Create Json Web Token
app.post("/api/v1/auth/access-token", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.SECRETE, { expiresIn: "365days" });
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .send({ success: true });
});

app.post("/api/v1/auth/status", async (req, res) => {
  const { email } = req.body;
  const query = { email: email };
  const user = await employeesCollection.findOne(query);
  if (user.role === "fired") {
    return res.status(403).send({ message: "Fired" });
  }
  res.status(200).send({ message: "Ok" });
});

app.post("/api/v1/auth/logout", async (req, res) => {
  const user = req.body;
  res.clearCookie("token").send({ success: true });
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("TechFirm IT Server is running");
});

app.listen(port, () => {
  console.log(`Server running in the port: ${port}`);
});
