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
