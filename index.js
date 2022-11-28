const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
console.log(stripe);
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

/* // Jwt Token
 function verifyJWT(req, res, next) {
  console.log("token inside verifyJWT", req.headers.authorization);
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
} 
 */
async function run() {
  try {
    const productsCollection = client
      .db("resellProduct")
      .collection("products");
    const categoriesCollection = client
      .db("resellProduct")
      .collection("categories");
    const bookingsCollection = client
      .db("resellProduct")
      .collection("bookings");
    const usersCollection = client.db("resellProduct").collection("users");
    const newProductsCollection = client
      .db("resellProduct")
      .collection("newProducts");
    const paymentsCollection = client
      .db("resellProduct")
      .collection("payments");

       // 1st check jwt token was correctly work or not
   /*  app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "50d",
        });
        return res.send({ token: token });
      }
      res.status(403).send({ token: "" });
    }); */


    // NOTE: make sure you use verifyAdmin after verifyJWT
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };
    const verifySeller = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);
      if (user?.role !== "seller") {
        return res.status(403).send({ message: "forbidden access" });
      }
      next();
    };

    // ------------------------CATEGORIES----------------------
    // get all categories API start
    app.get("/categories", async (req, res) => {
      const query = {};
      const categories = await categoriesCollection.find(query).toArray();
      res.send(categories);
    });
    // get all categories API end

    // get single category product API start
    app.get("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const query = { category_id: id };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });
    // ---------------------------BOOKINGS------------------------
    // Bookings Create on database:
    app.post("/bookings", async (req, res) => {
      const bookings = req.body;
      const result = await bookingsCollection.insertOne(bookings);
      res.send(result);
    });

    // Get Bookings Data from database on table:
    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
     /*  const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      console.log(email) */

      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    // Delete
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await bookingsCollection.deleteOne(filter);
      res.send(result);
    });
    // -------------USER------------------
    // as a buyer or as a seller sign up create:
    app.post("/users", async (req, res) => {
      const user = req.body;
      // console.log(user);
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });
    /* ------Update----User---------- */
    // get All User
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });
    // check seller verify or not:
    app.put("/users/verify/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          verification: "verify",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    //---------- check admin-------
    app.put("/users/admin/:id",  async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    /*  */
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "seller" });
    });
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    /* --------Delete------------- */
    // ----delete user----
    app.delete("/users/:id",async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });

    // ------------------PRODUCT-----------------
    /* -----Add Product-------- */
    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      const products = await newProductsCollection.insertOne(newProduct);
      const product = await productsCollection.insertOne(newProduct);
      // const category = await categoriesCollection.insertOne(newProduct);
      res.send({ products,product});
      // res.send(products)
      // res.send(products)
    });

   

    app.get("/products", async (req, res) => {
      const query = {};
      const newProducts = await newProductsCollection.find(query).toArray();
      // const category = await categoriesCollection.find(query).toArray();
      res.send(newProducts);
    });
    /* -------Delete Product------- */
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const results = await newProductsCollection.deleteOne(filter);
      const result = await productsCollection.deleteOne(filter);
      res.send({result,results});
    });

    // -------Payment--------
    app.get("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const booking = await bookingsCollection.findOne(query);
      res.send(booking);
    });

    // ------Payment-gateway------
    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    //------------- Payment--------------
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await bookingsCollection.updateOne(
        filter,
        updatedDoc
      );
      const updatedResults = await newProductsCollection.updateOne(
        filter,
        updatedDoc
      );
      const updatedResulted = await productsCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send( result);
    });
  } catch (error) {
    console.log(error);
    res.send({
      success: false,
      error: error.message,
    });
  } finally {
  }
}
run().catch((err) => console.error(err));

app.get("/", async (req, res) => {
  res.send("e-commerce re-selling server is running");
});

app.listen(port, () => {
  client.connect((err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Connected to MongoDB");
    }
  });
  console.log(`e-commerce re-selling server is running on ${port}`);
});

/***
 * API Naming Convention
 * app.get('/bookings')
 * app.get('/bookings/:id')
 * app.post('/bookings')
 * app.patch('/bookings/:id')
 * app.delete('/bookings/:id')
 */
