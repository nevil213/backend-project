// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";

// import express from "express";
// const app = express();

import 'dotenv/config'
import connectDB from './db/index.js'


connectDB();


/*
;( async ()=> {

    try {
        
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        app.on("error", (error) => {
            console.error("Error: ", error);
            throw error            
        })

        app.listen(process.env.PORT, () => {
            console.log(`app is listening on ${process.env.PORT}`)
        })

    } catch (error) {
        console.error("Error: ", error);
        throw error
    }
})()
*/