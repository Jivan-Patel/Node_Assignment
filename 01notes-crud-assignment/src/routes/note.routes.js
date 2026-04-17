const Note = require("../models/note.model");
const { createNote, createNotes } = require("../controllers/note.controller");
const express = require("express");
const router = express.Router();

router.post("/notes", createNotes);
router.post("/notes/bulk", createNotes);

module.exports = router;