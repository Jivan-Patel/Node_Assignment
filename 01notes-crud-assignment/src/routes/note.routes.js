const Note = require("../models/note.model");
const { createNote, createNotes, getNotes } = require("../controllers/note.controller");
const express = require("express");
const router = express.Router();

router.post("/notes", createNotes);
router.post("/notes/bulk", createNotes);
router.get("/notes", getNotes);

module.exports = router;