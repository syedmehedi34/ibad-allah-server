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
      "https://ibad-allah.netlify.app",
      "https://ibad-allah.surge.sh",
    ], // Update for production if needed
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
        const userEmail = allAnswerInfo.userInformation?.userEmail;
        const submittedDate = allAnswerInfo.userInformation?.date;

        // Validate input
        if (!userEmail || !submittedDate) {
          return res.status(400).json({
            message: "userEmail and date are required in userInformation",
          });
        }

        // Normalize date to yyyy-MM-dd (ensure consistency)
        const todayDate = submittedDate; // e.g., "2025-04-16"
        // Alternatively, you could use server date: format(new Date(), "yyyy-MM-dd")

        // Query to find existing document
        const query = {
          "userInformation.userEmail": userEmail,
          "userInformation.date": todayDate,
        };

        // Update or insert document
        const updateResult = await amalTracker.findOneAndUpdate(
          query,
          { $set: allAnswerInfo }, // Replace entire document with new data
          {
            upsert: true, // Insert if no match found
            returnDocument: "after", // Return updated/new document
          }
        );

        // Prepare response
        const response = {
          message: updateResult.value
            ? "Amal data updated successfully"
            : "Amal data saved successfully",
          insertedId: updateResult.value?._id || updateResult.upsertedId,
        };

        res.status(201).json(response);
      } catch (error) {
        console.error("Error saving amal data:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
    //*

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

    //* get amal details by date
    app.get("/amal_data_by_date", async (req, res) => {
      try {
        const { userEmail, date } = req.query;

        if (!userEmail || !date) {
          return res.status(400).json({
            message: "userEmail and date query parameters are required",
          });
        }

        const query = {
          "userInformation.userEmail": userEmail,
          "userInformation.date": date,
        };

        const document = await amalTracker.findOne(query);

        res.status(200).json(document || {});
      } catch (error) {
        console.error("Error fetching amal data:", error);
        res.status(500).json({ message: "Internal server error" });
      }
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
