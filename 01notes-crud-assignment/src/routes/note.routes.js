const Note = require("../models/note.model");
const { createNote, createNotes, getNotes, getNoteByID, replaceNote, updateFields, deleteOneField, deleteBulkFields } = require("../controllers/note.controller");
const express = require("express");
const router = express.Router();

router.post("/notes", createNote);
router.post("/notes/bulk", createNotes);
router.get("/notes", getNotes);
router.get("/notes/:id", getNoteByID);
router.put("/notes/:id", replaceNote);
router.patch("/notes/:id", updateFields);
router.delete("/notes/bulk", deleteBulkFields);
router.delete("/notes/:id", deleteOneField);

module.exports = router;