import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from Vercel!");
});

import sendEmailRouter from "./api/send-email.js";
app.use("/api", sendEmailRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://portfolio-1-ten-mocha.vercel.app", "https://portfolio-2-frontend-umber.vercel.app");
  next();
});
