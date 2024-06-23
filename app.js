import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import router from "./routes/feed.js";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  password: process.env.DB_PASSWORD,
};

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "get, post, put, patch, delete"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/feed", router);

mongoose
  .connect(
    `mongodb+srv://leejw951208:${dbConfig.password}@leejinwoo.olyxjw0.mongodb.net/messages?retryWrites=true&w=majority&appName=leejinwoo`
  )
  .then((result) => {
    app.listen(8080);
  })
  .catch((err) => console.log(err));
