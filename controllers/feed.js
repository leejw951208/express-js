import { validationResult } from "express-validator";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import Post from "../models/post.js";
import User from "../models/user.js";

const getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: "Fetched posts successfully.",
      posts,
      totalItems,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incoreect.");
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path.replace("\\", "/");
  const title = req.body.title;
  const content = req.body.content;
  let creator;

  const post = new Post({
    title: title,
    content: content,
    imageUrl: imageUrl,
    creator: req.userId,
  });
  try {
    await post.save();
    const user = await User.findById(req.userId);
    user.posts.push(post);
    await user.save();
    res.status(201).json({
      message: "Post created successfully!",
      post,
      creator: { _id: user._id, name: user.name },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const findPost = await Post.findById(postId);
    if (!findPost) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ message: "Post fetched.", post: findPost });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incoreect.");
    error.statusCode = 422;
    throw error;
  }
  const postId = req.params.postId;
  const title = req.body.title;
  const content = req.body.content;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path.replace("\\", "/");
  }
  if (!imageUrl) {
    const error = new Error("No file picked.");
    error.statusCode = 422;
    throw error;
  }
  try {
    const findPost = await Post.findById(postId);
    if (!findPost) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    if (findPost.creator.toString() !== req.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }
    if (imageUrl !== findPost.imageUrl) {
      clearImage(findPost.imageUrl);
    }
    findPost.title = title;
    findPost.imageUrl = imageUrl;
    findPost.content = content;
    const savedPost = await findPost.save();
    res.status(200).json({ message: "Post updated!", post: savedPost });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const findPost = await Post.findById(postId);
    if (!findPost) {
      const error = new Error("Could not find post.");
      error.statusCode = 404;
      throw error;
    }
    if (findPost.creator.toString() !== req.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }
    clearImage(findPost.imageUrl);
    await Post.findByIdAndDelete(postId);
    const findUser = await User.findById(req.userId);
    findUser.posts.pull(postId);
    const savedUser = await findUser.save();
    console.log(savedUser);
    res.status(200).json({ message: "Deleted post." });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const clearImage = (filePath) => {
  const __dirname = fileURLToPath(new URL("..", import.meta.url));
  filePath = path.join(__dirname, filePath);
  fs.unlink(filePath, (err) => console.log(err));
};

export { getPosts, createPost, getPost, updatePost, deletePost };
