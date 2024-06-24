import express from "express";
import { body } from "express-validator";
import { getPosts, createPost, getPost } from "../controllers/feed.js";
import { check } from "express-validator";

const router = express.Router();

router.get("/posts", getPosts);
router.post(
  "/posts",
  [
    body("title").trim().isLength({ min: 7 }),
    body("content").trim().isLength({ min: 7 }),
  ],
  createPost
);

router.get("/post/:postId", getPost);

export default router;
