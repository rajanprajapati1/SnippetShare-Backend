import mongoose from "mongoose";

const MongoDbConnect = async()=>{
    try {
     await mongoose.connect(process.env.MONGO_URI);
     console.log("MongoDb Connected Successfully...")
    } catch (error) {
        console.log("Failed To Connect...")
    }
}

export default MongoDbConnect;