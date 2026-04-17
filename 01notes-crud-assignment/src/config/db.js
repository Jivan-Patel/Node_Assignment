const mongoose = require("mongoose");
const env = require("dotenv");
env.config();

const URL = process.env.MONGO_URL;

async function connectDB() {
    mongoose.connect(URL)
        .then(() => console.log("DB connected"))
        .catch((error) => console.log(error));
}

module.exports = connectDB;