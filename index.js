const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5001;
const { MongoClient, ServerApiVersion } = require("mongodb");

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"], // Update for production if needed
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0uhyg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Database and collections
    const amalTracker = client.db("IbadAllah").collection("amalTracker");

    // Middleware to verify JWT (optional, for protected routes)

    //----------------- All APIs -----------------//
    //* saved amal data to backend
    app.post("/amal_data", async (req, res) => {
      try {
        const allAnswerInfo = req.body;
        // console.log(allAnswerInfo);

        const result = await amalTracker.insertOne(allAnswerInfo);

        // Send success response
        res.status(201).json({
          message: "Amal data saved successfully",
          insertedId: result.insertedId,
        });
      } catch (error) {
        console.error("Error saving amal data:", error);
        res.status(500).json({ error: "Failed to save amal data" });
      }
    });
    //

    // * get all amal data by user
    app.get("/amal_data", async (req, res) => {
      const userEmail = req.query.userEmail;
      if (!userEmail) {
        return res.status(400).json({ message: "Email query is required" });
      }

      console.log("Fetching data for email:", userEmail);

      const query = { "userInformation.userEmail": userEmail };
      const result = await amalTracker.find(query).toArray();

      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: "No data found for this email" });
      }

      res.json(result);
    });

    //--------------------------------------------//
  } catch (error) {
    console.error("Error in run:", error);
  }
  // Note: Do NOT close client here; keep connection open for the app
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running at: ${port}`);
});
