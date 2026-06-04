const mongoose = require("mongoose");
const Note = require("../models/note.model");

const allowedCategories = ["work", "personal", "study"];
const allowedSortFields = ["title", "createdAt", "updatedAt", "category"];

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function sendSuccess(res, statusCode, message, data, extra = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    ...extra,
    data,
  });
}

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
}

function validateCategory(category) {
  return allowedCategories.includes(category);
}

function parsePagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  return { page, limit, skip: (page - 1) * limit };
}

function buildPagination(total, page, limit) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1 && totalPages > 0,
  };
}

function buildSort(query) {
  const sortBy = query.sortBy || "createdAt";
  if (!allowedSortFields.includes(sortBy)) {
    return { error: true };
  }

  const order = query.order === "asc" ? 1 : -1;
  const direction = order === 1 ? "ascending" : "descending";
  return { sortBy, order, direction };
}

function buildBaseFilter(query) {
  const filter = {};

  if (query.category) {
    if (!validateCategory(query.category)) {
      return { error: "Invalid category. Allowed: work, personal, study" };
    }
    filter.category = query.category;
  }

  if (query.isPinned !== undefined) {
    if (query.isPinned !== "true" && query.isPinned !== "false") {
      return { error: "isPinned must be true or false" };
    }
    filter.isPinned = query.isPinned === "true";
  }

  return { filter };
}

function buildSearchFilter(q, fields = ["title", "content"]) {
  const $or = fields.map((field) => ({
    [field]: { $regex: q, $options: "i" },
  }));
  return { $or };
}

async function createNote(req, res) {
  try {
    const { title, content, category = "personal", isPinned = false } = req.body;

    if (!title || !content) {
      return sendError(res, 400, "Title and content are required");
    }

    if (!validateCategory(category)) {
      return sendError(res, 400, "Invalid category. Allowed: work, personal, study");
    }

    const note = await Note.create({ title, content, category, isPinned });
    return sendSuccess(res, 201, "Note created successfully", note);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function createBulkNotes(req, res) {
  try {
    const { notes } = req.body;

    if (!Array.isArray(notes) || notes.length === 0) {
      return sendError(res, 400, "notes array is required and cannot be empty");
    }

    for (const note of notes) {
      if (!note.title || !note.content) {
        return sendError(res, 400, "Each note must have title and content");
      }
      if (note.category && !validateCategory(note.category)) {
        return sendError(res, 400, "Invalid category. Allowed: work, personal, study");
      }
    }

    const createdNotes = await Note.insertMany(notes);
    return sendSuccess(res, 201, `${createdNotes.length} notes created successfully`, createdNotes);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function getAllNotes(req, res) {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    return sendSuccess(res, 200, "Notes fetched successfully", notes, { count: notes.length });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function getNoteById(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid note ID");

    const note = await Note.findById(id);
    if (!note) return sendError(res, 404, "Note not found");

    return sendSuccess(res, 200, "Note fetched successfully", note);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function getNoteSummary(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid note ID");

    const note = await Note.findById(id).select("title category isPinned createdAt");
    if (!note) return sendError(res, 404, "Note not found");

    return sendSuccess(res, 200, "Note summary fetched successfully", note);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function replaceNote(req, res) {
  try {
    const { id } = req.params;
    const { title, content, category = "personal", isPinned = false } = req.body;

    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid note ID");
    if (!title || !content) return sendError(res, 400, "Title and content are required");
    if (!validateCategory(category)) {
      return sendError(res, 400, "Invalid category. Allowed: work, personal, study");
    }

    const replacedNote = await Note.findByIdAndUpdate(
      id,
      { title, content, category, isPinned },
      { new: true, overwrite: true, runValidators: true }
    );

    if (!replacedNote) return sendError(res, 404, "Note not found");
    return sendSuccess(res, 200, "Note replaced successfully", replacedNote);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function updateNote(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid note ID");
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendError(res, 400, "No fields provided to update");
    }

    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.content !== undefined) updates.content = req.body.content;
    if (req.body.category !== undefined) {
      if (!validateCategory(req.body.category)) {
        return sendError(res, 400, "Invalid category. Allowed: work, personal, study");
      }
      updates.category = req.body.category;
    }
    if (req.body.isPinned !== undefined) updates.isPinned = req.body.isPinned;

    if (Object.keys(updates).length === 0) {
      return sendError(res, 400, "No fields provided to update");
    }

    const updatedNote = await Note.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedNote) return sendError(res, 404, "Note not found");
    return sendSuccess(res, 200, "Note updated successfully", updatedNote);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function deleteNote(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return sendError(res, 400, "Invalid note ID");

    const deletedNote = await Note.findByIdAndDelete(id);
    if (!deletedNote) return sendError(res, 404, "Note not found");

    return sendSuccess(res, 200, "Note deleted successfully", null);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function deleteBulkNotes(req, res) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return sendError(res, 400, "ids array is required and cannot be empty");
    }

    const invalidId = ids.find((id) => !isValidObjectId(id));
    if (invalidId) return sendError(res, 400, "Invalid note ID");

    const result = await Note.deleteMany({ _id: { $in: ids } });
    return sendSuccess(res, 200, `${result.deletedCount} notes deleted successfully`, null);
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function searchByTitle(req, res) {
  try {
    const { q } = req.query;
    if (!q) return sendError(res, 400, "Search query 'q' is required");

    const notes = await Note.find({ title: { $regex: q, $options: "i" } }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, `Search results for: ${q}`, notes, { count: notes.length });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function searchByContent(req, res) {
  try {
    const { q } = req.query;
    if (!q) return sendError(res, 400, "Search query 'q' is required");

    const notes = await Note.find({ content: { $regex: q, $options: "i" } }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, `Content search results for: ${q}`, notes, { count: notes.length });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function searchAll(req, res) {
  try {
    const { q } = req.query;
    if (!q) return sendError(res, 400, "Search query 'q' is required");

    const notes = await Note.find(buildSearchFilter(q)).sort({ createdAt: -1 });
    return sendSuccess(res, 200, `Search results for: ${q}`, notes, { count: notes.length });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function filterAndSort(req, res) {
  try {
    const base = buildBaseFilter(req.query);
    if (base.error) return sendError(res, 400, base.error);

    const sortConfig = buildSort(req.query);
    if (sortConfig.error) {
      return sendError(res, 400, "Invalid sortBy. Allowed: title, createdAt, updatedAt, category");
    }

    const notes = await Note.find(base.filter).sort({ [sortConfig.sortBy]: sortConfig.order });
    return sendSuccess(res, 200, "Notes fetched successfully", notes, { count: notes.length });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function filterAndPaginate(req, res) {
  try {
    const base = buildBaseFilter(req.query);
    if (base.error) return sendError(res, 400, base.error);

    const { page, limit, skip } = parsePagination(req.query);
    const total = await Note.countDocuments(base.filter);
    const notes = await Note.find(base.filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    return sendSuccess(res, 200, "Notes fetched successfully", notes, {
      pagination: buildPagination(total, page, limit),
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function sortAndPaginate(req, res) {
  try {
    const sortConfig = buildSort(req.query);
    if (sortConfig.error) {
      return sendError(res, 400, "Invalid sortBy. Allowed: title, createdAt, updatedAt, category");
    }

    const { page, limit, skip } = parsePagination(req.query);
    const total = await Note.countDocuments();
    const notes = await Note.find().sort({ [sortConfig.sortBy]: sortConfig.order }).skip(skip).limit(limit);

    return sendSuccess(res, 200, "Notes fetched successfully", notes, {
      pagination: buildPagination(total, page, limit),
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function searchAndFilter(req, res) {
  try {
    const { q } = req.query;
    if (!q) return sendError(res, 400, "Search query 'q' is required");

    const base = buildBaseFilter(req.query);
    if (base.error) return sendError(res, 400, base.error);

    const filter = { ...base.filter, ...buildSearchFilter(q) };
    const notes = await Note.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, 200, `Search results for: ${q}`, notes, { count: notes.length });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function searchSortPaginate(req, res) {
  try {
    const { q } = req.query;
    if (!q) return sendError(res, 400, "Search query 'q' is required");

    const sortConfig = buildSort(req.query);
    if (sortConfig.error) {
      return sendError(res, 400, "Invalid sortBy. Allowed: title, createdAt, updatedAt, category");
    }

    const { page, limit, skip } = parsePagination(req.query);
    const filter = buildSearchFilter(q);
    const total = await Note.countDocuments(filter);
    const notes = await Note.find(filter)
      .sort({ [sortConfig.sortBy]: sortConfig.order })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 200, `Search results for: ${q}`, notes, {
      pagination: buildPagination(total, page, limit),
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function filterSortPaginate(req, res) {
  try {
    const base = buildBaseFilter(req.query);
    if (base.error) return sendError(res, 400, base.error);

    const sortConfig = buildSort(req.query);
    if (sortConfig.error) {
      return sendError(res, 400, "Invalid sortBy. Allowed: title, createdAt, updatedAt, category");
    }

    const { page, limit, skip } = parsePagination(req.query);
    const total = await Note.countDocuments(base.filter);
    const notes = await Note.find(base.filter)
      .sort({ [sortConfig.sortBy]: sortConfig.order })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 200, "Notes fetched successfully", notes, {
      pagination: buildPagination(total, page, limit),
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

async function masterQuery(req, res) {
  try {
    const { q, category, isPinned, sortBy, order, page, limit } = req.query;

    const filter = {};
    if (q) filter.$or = buildSearchFilter(q).$or;
    if (category) {
      if (!validateCategory(category)) {
        return sendError(res, 400, "Invalid category. Allowed: work, personal, study");
      }
      filter.category = category;
    }
    if (isPinned !== undefined) {
      if (isPinned !== "true" && isPinned !== "false") {
        return sendError(res, 400, "isPinned must be true or false");
      }
      filter.isPinned = isPinned === "true";
    }

    const sortConfig = buildSort({ sortBy, order });
    if (sortConfig.error) {
      return sendError(res, 400, "Invalid sortBy. Allowed: title, createdAt, updatedAt, category");
    }

    const pagination = parsePagination({ page, limit });
    const total = await Note.countDocuments(filter);
    const notes = await Note.find(filter)
      .sort({ [sortConfig.sortBy]: sortConfig.order })
      .skip(pagination.skip)
      .limit(pagination.limit);

    return sendSuccess(res, 200, "Notes fetched successfully", notes, {
      pagination: buildPagination(total, pagination.page, pagination.limit),
    });
  } catch (error) {
    return sendError(res, 500, error.message);
  }
}

module.exports = {
  createNote,
  createBulkNotes,
  getAllNotes,
  getNoteById,
  getNoteSummary,
  replaceNote,
  updateNote,
  deleteNote,
  deleteBulkNotes,
  searchByTitle,
  searchByContent,
  searchAll,
  filterAndSort,
  filterAndPaginate,
  sortAndPaginate,
  searchAndFilter,
  searchSortPaginate,
  filterSortPaginate,
  masterQuery,
};