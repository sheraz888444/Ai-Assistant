import express from "express"
import { Login, Logout, signUp } from "../controllers/authController.js";

const auth = express.Router();

auth.post("/register",signUp )

auth.post("/login", Login)
auth.get("/logout",Logout )
export default auth;