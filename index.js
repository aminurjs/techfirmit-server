const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const stripe = require("stripe")(process.env.Stripe_Secrete_Key);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.port || 5000;

//MiddleWare
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);

// middlewares
//verify token and  access
const verifyToken = (req, res, next) => {
  const { token } = req.cookies;

  //if client does not send token
  if (!token) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }

  // verify a token
  jwt.verify(token, process.env.SECRETE, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "UnAuthorized Access" });
    }
    // attach decoded user so that others can get it
    req.user = decoded;
    next();
  });
};

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
const workSheetCollection = client.db("techFirmIT").collection("workSheet");
const paymentsCollection = client.db("techFirmIT").collection("payments");

//Public data
//Data get Functions
app.get("/api/v1/services", async (req, res) => {
  const services = await servicesCollection.find().toArray();
  res.send(services);
});
app.get("/api/v1/testimonials", async (req, res) => {
  const testimonials = await testimonialsCollection.find().toArray();
  res.send(testimonials);
});
//Data Post Functions
app.post("/api/v1/employees", async (req, res) => {
  const data = req.body;
  const result = await employeesCollection.insertOne(data);
  res.send(result);
});

//Admin Checking method added
app.get("/api/v1/employee/admin/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  const tokenEmail = req.user.email;

  if (email !== tokenEmail) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const query = { email: email };
  const user = await employeesCollection.findOne(query);
  let admin = false;
  if (user) {
    admin = user?.role === "admin";
  }
  res.send({ admin });
});

//Secure Data For Admin
//Data get Functions
app.get("/api/v1/all-employee", verifyToken, async (req, res) => {
  const query = { verified: true };
  const allEmployees = await employeesCollection.find(query).toArray();
  res.send(allEmployees);
});
//Data Update Functions
app.patch("/api/v1/update-role/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updateVerified = {
    $set: { role: "hr" },
  };
  const result = await employeesCollection.updateOne(query, updateVerified);
  res.send(result);
});
app.patch("/api/v1/employee/fire/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updateVerified = {
    $set: { role: "fired" },
  };
  const result = await employeesCollection.updateOne(query, updateVerified);
  res.send(result);
});

//HR Checking method
app.get("/api/v1/employee/hr/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  const tokenEmail = req.user.email;

  if (email !== tokenEmail) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const query = { email: email };
  const user = await employeesCollection.findOne(query);
  let HR = false;
  if (user) {
    HR = user?.role === "hr";
  }
  res.send({ HR });
});

//Secure for HR
//Data get Functions
app.get("/api/v1/employee-list", verifyToken, async (req, res) => {
  const query = { role: "employee" };
  const employeeList = await employeesCollection.find(query).toArray();
  res.send(employeeList);
});

app.get("/api/v1/details/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  const query = { email: email };
  const user = await employeesCollection.findOne(query);
  const payment = await paymentsCollection.find(query).toArray();
  res.send({ user, payment });
});
app.get("/api/v1/all-works", verifyToken, async (req, res) => {
  const { filter } = req.query;
  if (filter === "default") {
    const result = await workSheetCollection.find().toArray();
    res.send(result);
  } else {
    const query = { name: filter };
    const result = await workSheetCollection.find(query).toArray();
    res.send(result);
  }
});
//Data post Functions
app.post("/api/v1/payment-data", verifyToken, async (req, res) => {
  const data = req.body;
  const result = await paymentsCollection.insertOne(data);
  res.send(result);
});
app.post("/api/v1/checking-payment", verifyToken, async (req, res) => {
  const data = req.body;
  const query = {
    email: data.email,
    month: data.selectedMonth,
    year: data.selectedYear,
  };
  const result = await paymentsCollection.findOne(query);
  if (result) {
    res.send({ status: true });
  } else {
    res.send({ status: false });
  }
});

//Data Update Functions
app.patch("/api/v1/employees/verified/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const updateVerified = {
    $set: { verified: true },
  };
  const result = await employeesCollection.updateOne(query, updateVerified);
  res.send(result);
});

//HR Checking method
app.get("/api/v1/employee/:email", verifyToken, async (req, res) => {
  const email = req.params.email;
  const tokenEmail = req.user.email;

  if (email !== tokenEmail) {
    return res.status(403).send({ message: "forbidden access" });
  }

  const query = { email: email };
  const user = await employeesCollection.findOne(query);
  let employee = false;
  if (user) {
    employee = user?.role === "employee";
  }
  res.send({ employee });
});

//Secure For Employee
//Data Post Functions
app.post("/api/v1/work-sheet", verifyToken, async (req, res) => {
  const data = req.body;
  const result = await workSheetCollection.insertOne(data);
  res.send(result);
});

//Data get Functions
app.get(
  "/api/v1/employee/payment-history/:email",
  verifyToken,
  async (req, res) => {
    const email = req.params.email;
    const query = { email: email };
    const result = await paymentsCollection.find(query).toArray();
    res.send(result);
  }
);
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
// Auth status checking
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

app.post("/api/v1/create-payment-intent", async (req, res) => {
  const { price } = req.body;
  const amount = parseInt(price * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "usd",
    payment_method_types: ["card"],
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
  });
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
