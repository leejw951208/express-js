import User from "../models/user.js";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed.");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  try {
    const hashedPw = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedPw,
      name,
    });
    const savedUser = await user.save();
    res.status(201).json({ message: "User created!", userId: savedUser._id });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const findUser = await User.findOne({ email });
    if (!findUser) {
      const error = new Error("A user with this email could be not found.");
      error.statusCode = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, findUser.password);
    if (!isEqual) {
      const error = new Error("Wrong password!");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: findUser.email,
        userId: findUser._id.toString(),
      },
      "somesupersecret",
      { expiresIn: "1h" }
    );
    res.status(200).json({ token, userId: findUser._id.toString() });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

export { signup, login };
