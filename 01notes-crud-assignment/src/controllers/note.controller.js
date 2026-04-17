const Note = require("../models/note.model");

exports.createNote = async (req, res) => {
  try {
    const note = new Note(req.body);
    await note.save();
    res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: note
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.createNotes = async (req, res) => {
  try {
    const notes = req.body.map((noteData) => new Note(noteData));
    const savedNotes = await Promise.all(notes.map((note) => note.save()));
    res.status(201).json({
      success: true,
      message: "Notes created successfully",
      data: savedNotes
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getNotes = async (req, res) => {
    try {
        const notes = await Note.find();
        res.status(200).json({
            success: true,
            message: "Notes retrieved successfully",
            data: notes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getNoteByID = async (req, res) => {
    const id = req.params.id;
    try {
        const note = await Note.findOne({ _id: id });
        res.status(200).json({
            success: true,
            message: "Note fetched successfully",
            data: note
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};