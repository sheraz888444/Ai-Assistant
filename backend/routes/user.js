import express from "express"
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { getCurrentUser, updateAssistant, updateProfile, addCommandToHistory, getCommandHistory } from "../controllers/userController.js";

const user = express.Router();

user.get("/currentUser", isAuth, getCurrentUser);
// Alias as per spec
user.get("/me", isAuth, getCurrentUser);

// Legacy assistant name-only endpoint (kept for compatibility)
user.post("/update-assistant", isAuth, updateAssistant);

// New profile endpoint: accepts name and image, marks setup complete when both present
user.post("/update-profile", isAuth, upload.single('image'), updateProfile);

user.post("/command-history", isAuth, addCommandToHistory); // New endpoint for adding command history
user.get("/command-history", isAuth, getCommandHistory); // New endpoint for retrieving command history

export default user;
