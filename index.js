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
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://ibad-allah.netlify.app",
      "https://ibad-allah.surge.sh",
    ],
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
    const dailyAmalTracker = client
      .db("IbadAllah")
      .collection("dailyAmalTracker");

    // Middleware to verify JWT (optional, for protected routes)

    //----------------- All APIs -----------------//
    //* saved amal data to backend
    app.post("/amal_data", async (req, res) => {
      try {
        const dailyAmalData = req.body;
        const userEmail = dailyAmalData.info?.userEmail;
        const amalDate = dailyAmalData.info?.amalDate;

        // Validate input
        if (!userEmail || !amalDate) {
          return res.status(400).json({
            message: "userEmail and date are required in userInformation",
          });
        }

        // Normalize date to dd-mm-yyyy (ensure consistency)
        const todayDate = amalDate; // e.g., "16-04-2025"
        // Alternatively, I could use server date: format(new Date(), "yyyy-MM-dd")

        // Query to find existing document
        const query = {
          "info.userEmail": userEmail,
          "info.amalDate": todayDate,
        };

        // Update or insert document
        const updateResult = await amalTracker.findOneAndUpdate(
          query,
          { $set: dailyAmalData }, // Replace entire document with new data
          {
            upsert: true, // Insert if no match found
            returnDocument: "after", // Return updated/new document
          }
        );

        // Prepare response
        const response = {
          savedAmalDetails: updateResult,
          message: updateResult.value
            ? "Amal data updated successfully"
            : "Amal data saved successfully",
          insertedId: updateResult.value?._id || updateResult.upsertedId,
        };

        res.status(201).json(response);
      } catch (error) {
        // console.error("Error saving amal data:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    //*

    // ? get all amal data by user
    app.get("/amal_data", async (req, res) => {
      const userEmail = req.query.userEmail;

      if (!userEmail) {
        return res.status(400).json({ message: "Email query is required" });
      }

      // console.log("Fetching data for email:", userEmail);

      const query = { "info.userEmail": userEmail };
      const result = await amalTracker.find(query).toArray();

      if (result.length === 0) {
        return res
          .status(404)
          .json({ message: "No data found for this email" });
      }

      res.json(result);
    });

    //* get amal details by date
    app.get("/amal_data_by_date", async (req, res) => {
      try {
        const { userEmail, amalDate } = req.query;

        if (!userEmail || !amalDate) {
          return res.status(400).json({
            message: "userEmail and date query parameters are required",
          });
        }

        const query = {
          "userInformation.userEmail": userEmail,
          "userInformation.amalDate": amalDate,
        };

        const document = await amalTracker.findOne(query);

        res.status(200).json(document || {});
      } catch (error) {
        // console.error("Error fetching amal data:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });

    //--------------------------------------------//
  } catch (error) {
    // console.error("Error in run:", error);
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
