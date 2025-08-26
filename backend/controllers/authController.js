import genToken from "../config/token.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

//signup controller
export const signUp = async (req, res) => {
try {
    const {name,email,password}=req.body;
        const existingUser = await User.findOne({ email });
    if(existingUser){
        return res.status(400).json({message:"email already exists"});
    }
    if(password.length<6){
        return res.status(400).json({message:"password must be at least 6 characters"});
    }
    const hashedPassword=await bcrypt.hash(password,10);
        const user = await User.create({ name, email, password: hashedPassword });

    const token = await genToken(user._id);
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    const { password: _pwd, ...userData } = user._doc;
    return res.status(201).json(userData);

    } catch (error) {
  return res.status(500).json({message:" signup  error"})
}
}

//login controller
export const Login = async (req, res) => {
try {
    const {email,password}=req.body;
        const user = await User.findOne({ email });
    if(!user){
        return res.status(400).json({message:"email does not  exists"});
    }
    
        const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        return res.status(400).json({message:"invalid credentials"});
    }
   
    const token = await genToken(user._id);
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    const { password: _pwd, ...userData } = user._doc;
    return res.status(200).json(userData);

    } catch (error) {
  return res.status(500).json({message:" log in  error"})
}
}

//log out  controller
export const Logout = async (req, res) => {
    try {
                res.clearCookie("token", { sameSite: "strict", secure: process.env.NODE_ENV === "production" })   
        return res.status(200).json({message:"logged out successfully"})
        
    } catch (error) {
        return res.status(500).json({message:" log out  error"})
    }
}