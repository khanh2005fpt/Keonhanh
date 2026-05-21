import express from "express"
import mongoose from "mongoose"
import bodyParser from "body-parser"
import dotenv from "dotenv"
import cors from "cors"

import playerRoutes from "./routes/playerRoutes.js";
const app = express();
app.use(bodyParser.json());
app.use(cors());
dotenv.config();
app.use("/api/players", playerRoutes);

const PORT = process.env.PORT;
const MONGOURL = process.env.MONGO_URL;

mongoose.connect(MONGOURL).then(() => {
    console.log("DB connected successfully");
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on port: ${PORT}`);
    });
}).catch((error) => console.log(error));
   
