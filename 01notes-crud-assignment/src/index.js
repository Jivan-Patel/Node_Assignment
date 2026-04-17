const app = require("./app");
const connectDB = require("./config/db");

connectDB();

app.get("/", (req, res) => {
    res.send("Server is running");
})

app.listen(3000, () => {
    console.log("Server runs in 3000 port");
})