const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.grwbbr0.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Jwt Token
/* function verifyJWT(req, res, next) {
  // console.log("token inside verifyJWT", req.headers.authorization);
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }
  // bearer  eta split(" ") kora hoilo
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
} */






app.get("/", async (req, res) => {
  res.send("e-commerce server is running");
});

app.listen(port, () => console.log(`E-commerce Server running on ${port}`));
