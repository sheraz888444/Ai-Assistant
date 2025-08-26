import express from 'express'
import dotenv from "dotenv"
dotenv.config()
import cors from "cors"
import connectdb from './config/db.js'
import auth from "./routes/Auth.js"
import cookieParser from 'cookie-parser'
import user from './routes/user.js'
import ai from './routes/ai.js'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()

// Configure CORS to allow requests from any localhost port
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow requests from any localhost port
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    // For production, you might want to add your domain here
    // if (origin === 'https://yourdomain.com') return callback(null, true);
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

const PORT = process.env.PORT || 5000
app.use(express.json())
app.use(cookieParser())

// Serve static uploads (for profile images)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

app.use("/api/auth", auth)
app.use("/api/user", user)
app.use("/api/ai", ai)

app.listen(PORT, () => {
    connectdb();
    console.log(`Server is running on port ${PORT}`)
})
