import jwt from 'jsonwebtoken'
const isAuth=async (req,res,next)=>{
    try {
        const token=req.cookies.token
        if(!token){
            return res.status(401).json({message:"token not found"})
        }
        const decoded = jwt.verify(token, process.env.JWT_TOKEN);
        req.userId = decoded.id
        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}
export default isAuth