const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

//Data get Functions
app.get("/api/v1/services", async (req, res) => {
  const services = await servicesCollection.find().toArray();
  res.send(services);
});
app.get("/api/v1/testimonials", async (req, res) => {
  const testimonials = await testimonialsCollection.find().toArray();
  res.send(testimonials);
});

//Create Json Web Token
app.post("/api/v1/auth/access-token", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.SECRETE, { expiresIn: "365days" });
  console.log(token);
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .send({ success: true });
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
