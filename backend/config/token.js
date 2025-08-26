import jwt from 'jsonwebtoken'

const genToken=async (userId)=>{
try {
    
    const token = jwt.sign({ id: userId }, process.env.JWT_TOKEN, { expiresIn: "7d" });
    return token;
} catch (error) {
    console.log(error)
}
}
export default genToken;
