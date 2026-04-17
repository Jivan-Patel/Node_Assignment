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

exports.replaceNote = async (req, res) => {
    const id = req.params.id;
    const newNote = req.body;
    try {
        await Note.findOneAndReplace({ _id: id }, newNote);
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
}

exports.updateFields = async (req, res) => {
    const id = req.params.id;
    const newNote = req.body;
    try {
        await Note.findByIdAndUpdate({ _id: id }, newNote);
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
}

exports.deleteOneField = async (req, res) => {
    const id = req.params.id;
    try {
        await Note.deleteOne({ _id: id });
        res.status(200).json({
            success: true,
            message: "Note fetched successfully",
            data: null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.deleteBulkFields = async (req, res) => {
    const ids = req.body.ids;
    try {
        await Note.deleteMany({ _id: { $in: ids } });
        res.status(200).json({
            success: true,
            message: "Note fetched successfully",
            data: null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}