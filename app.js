import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import router from "./routes/feed.js";
import dotenv from "dotenv";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";

dotenv.config();

const dbConfig = {
  password: process.env.DB_PASSWORD,
};

const app = express();

const extractExtension = (filename) => {
  const fileLength = filename.length;
  const lastDot = filename.lastIndexOf(".");
  return filename.substring(lastDot, fileLength).toLowerCase();
};

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + extractExtension(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);

const __dirname = fileURLToPath(new URL(".", import.meta.url));
app.use("/images", express.static(path.join(__dirname, "images")));

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

app.use((error, req, res, next) => {
  console.log(error);
  const status = error.statusCode || 500;
  const message = error.message;
  res.status(status).json({ message: message });
});

mongoose
  .connect(
    `mongodb+srv://leejw951208:${dbConfig.password}@leejinwoo.olyxjw0.mongodb.net/messages?retryWrites=true&w=majority&appName=leejinwoo`
  )
  .then((result) => {
    app.listen(8080);
  })
  .catch((err) => console.log(err));
