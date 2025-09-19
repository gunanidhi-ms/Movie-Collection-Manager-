
import express from "express";
import router from "./routes/movies.routes.js";
import connectDB from "./lib/db.js";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();

//Data understanding middleware
app.use(express.json());
app.use(cors())

const port = process.env.PORT || 6969;
//connect MongoDB
connectDB();


// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Check MongoDB connection
    const dbState = (await import("mongoose")).default.connection.readyState;
    const dbConnected = dbState === 1;
    res.json({ backend: true, database: dbConnected });
  } catch (e) {
    res.status(500).json({ backend: true, database: false });
  }
});

//CRUD Operations for Movie
app.use("/movies", router);

app.listen(port, () => {
  console.log(`The server is running at http://localhost:${port}`);
});
