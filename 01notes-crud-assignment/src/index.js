const app = require("./app");
const connectDB = require("./config/db");
const PORT = process.env.PORT || 5000;
connectDB();

app.get("/", (req, res) => {
    res.send("Server is running");
})

app.listen(PORT, () => {
    console.log(`Server runs in ${PORT} port`);
})