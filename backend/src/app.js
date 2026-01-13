const express = require("express");
const cors = require("cors");
const analysisRoutes = require("./routes/analysis.routes");

const app = express();

app.use(
    cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })//allowed from our frontend only for cors
);

app.use(express.json());

app.use("/api/analysis", analysisRoutes);

module.exports = app;
