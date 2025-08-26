import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    assistantName: {
        type: String,
    },
    imagePath: {
        type: String,
    },
    hasCompletedSetup: {
        type: Boolean,
        default: false
    },
    history: [
        {
            command: String,
            response: String,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, { timestamps: true });
const User=mongoose.model("User",userSchema);
export default User;
