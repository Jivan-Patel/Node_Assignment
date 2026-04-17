const express = require('express');
const app = express();
app.use(express.json());

const noteRoutes = require("./routes/note.routes");
app.use("/api", noteRoutes);


module.exports = app;   