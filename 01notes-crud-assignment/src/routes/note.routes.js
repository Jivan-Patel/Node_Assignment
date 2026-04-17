const Note = require("../models/note.model");
const { createNote } = require("../controllers/note.controller");
const express = require("express");
const router = express.Router();

router.post("/notes", createNote);

module.exports = router;