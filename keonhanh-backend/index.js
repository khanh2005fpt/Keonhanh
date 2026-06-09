const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test API
app.get("/", (req, res) => {
  res.send("API Running...");
});

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));

const PORT = process.env.PORT || 9999;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});