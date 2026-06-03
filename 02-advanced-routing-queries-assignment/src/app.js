const express = require("express");
const noteRoutes = require("./routes/note.routes");

const app = express();

app.use(express.json());
app.use("/api/notes", noteRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    data: null,
  });
});

module.exports = app;