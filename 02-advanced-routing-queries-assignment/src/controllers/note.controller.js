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

	return {
		page,
		limit,
		skip: (page - 1) * limit,
	};
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

		return sendSuccess(
			res,
			201,
			`${createdNotes.length} notes created successfully`,
			createdNotes
		);
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function getAllNotes(req, res) {
	try {
		const notes = await Note.find().sort({ createdAt: -1 });

		return sendSuccess(res, 200, "Notes fetched successfully", notes, {
			count: notes.length,
		});
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function getNoteById(req, res) {
	try {
		const { id } = req.params;

		if (!isValidObjectId(id)) {
			return sendError(res, 400, "Invalid note ID");
		}

		const note = await Note.findById(id);

		if (!note) {
			return sendError(res, 404, "Note not found");
		}

		return sendSuccess(res, 200, "Note fetched successfully", note);
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function getNoteSummary(req, res) {
	try {
		const { id } = req.params;

		if (!isValidObjectId(id)) {
			return sendError(res, 400, "Invalid note ID");
		}

		const note = await Note.findById(id).select("title category isPinned createdAt");

		if (!note) {
			return sendError(res, 404, "Note not found");
		}

		return sendSuccess(res, 200, "Note summary fetched successfully", note);
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function replaceNote(req, res) {
	try {
		const { id } = req.params;
		const { title, content, category = "personal", isPinned = false } = req.body;

		if (!isValidObjectId(id)) {
			return sendError(res, 400, "Invalid note ID");
		}

		if (!title || !content) {
			return sendError(res, 400, "Title and content are required");
		}

		if (!validateCategory(category)) {
			return sendError(res, 400, "Invalid category. Allowed: work, personal, study");
		}

		const replacedNote = await Note.findByIdAndUpdate(
			id,
			{ title, content, category, isPinned },
			{ new: true, overwrite: true, runValidators: true }
		);

		if (!replacedNote) {
			return sendError(res, 404, "Note not found");
		}

		return sendSuccess(res, 200, "Note replaced successfully", replacedNote);
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function updateNote(req, res) {
	try {
		const { id } = req.params;
		const updates = {};

		if (!isValidObjectId(id)) {
			return sendError(res, 400, "Invalid note ID");
		}

		if (!req.body || Object.keys(req.body).length === 0) {
			return sendError(res, 400, "No fields provided to update");
		}

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

		if (!updatedNote) {
			return sendError(res, 404, "Note not found");
		}

		return sendSuccess(res, 200, "Note updated successfully", updatedNote);
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function deleteNote(req, res) {
	try {
		const { id } = req.params;

		if (!isValidObjectId(id)) {
			return sendError(res, 400, "Invalid note ID");
		}

		const deletedNote = await Note.findByIdAndDelete(id);

		if (!deletedNote) {
			return sendError(res, 404, "Note not found");
		}

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
		if (invalidId) {
			return sendError(res, 400, "Invalid note ID");
		}

		const result = await Note.deleteMany({ _id: { $in: ids } });

		return sendSuccess(
			res,
			200,
			`${result.deletedCount} notes deleted successfully`,
			null
		);
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function getNotesByCategory(req, res) {
	try {
		const { category } = req.params;

		if (!validateCategory(category)) {
			return sendError(res, 400, "Invalid category. Allowed: work, personal, study");
		}

		const notes = await Note.find({ category });

		if (notes.length === 0) {
			return sendError(res, 404, `No notes found for category: ${category}`);
		}

		return sendSuccess(res, 200, `Notes fetched for category: ${category}`, notes, {
			count: notes.length,
		});
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function getNotesByStatus(req, res) {
	try {
		const { isPinned } = req.params;

		if (isPinned !== "true" && isPinned !== "false") {
			return sendError(res, 400, "isPinned must be true or false");
		}

		const pinned = isPinned === "true";
		const notes = await Note.find({ isPinned: pinned });
		const label = pinned ? "pinned" : "unpinned";

		return sendSuccess(res, 200, `Fetched all ${label} notes`, notes, {
			count: notes.length,
		});
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function filterNotes(req, res) {
	try {
		const filter = {};

		if (req.query.category) {
			if (!validateCategory(req.query.category)) {
				return sendError(res, 400, "Invalid category. Allowed: work, personal, study");
			}

			filter.category = req.query.category;
		}

		if (req.query.isPinned !== undefined) {
			if (req.query.isPinned !== "true" && req.query.isPinned !== "false") {
				return sendError(res, 400, "isPinned must be true or false");
			}

			filter.isPinned = req.query.isPinned === "true";
		}

		const notes = await Note.find(filter).sort({ createdAt: -1 });

		return sendSuccess(res, 200, "Notes fetched successfully", notes, {
			count: notes.length,
		});
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function getPinnedNotes(req, res) {
	try {
		const filter = { isPinned: true };

		if (req.query.category) {
			if (!validateCategory(req.query.category)) {
				return sendError(res, 400, "Invalid category. Allowed: work, personal, study");
			}

			filter.category = req.query.category;
		}

		const notes = await Note.find(filter).sort({ createdAt: -1 });

		return sendSuccess(res, 200, "Pinned notes fetched successfully", notes, {
			count: notes.length,
		});
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function filterByCategory(req, res) {
	try {
		const { name } = req.query;

		if (!name) {
			return sendError(res, 400, "Query param 'name' is required");
		}

		if (!validateCategory(name)) {
			return sendError(res, 400, "Invalid category. Allowed: work, personal, study");
		}

		const notes = await Note.find({ category: name }).sort({ createdAt: -1 });

		return sendSuccess(res, 200, `Notes filtered by category: ${name}`, notes, {
			count: notes.length,
		});
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function filterByDateRange(req, res) {
	try {
		const { from, to } = req.query;

		if (!from || !to) {
			return sendError(res, 400, "Both 'from' and 'to' query params are required");
		}

		const fromDate = new Date(from);
		const toDate = new Date(to);

		if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
			return sendError(res, 400, "Invalid date range");
		}

		const notes = await Note.find({
			createdAt: {
				$gte: fromDate,
				$lte: toDate,
			},
		}).sort({ createdAt: -1 });

		return sendSuccess(
			res,
			200,
			`Notes fetched between ${from} and ${to}`,
			notes,
			{
				count: notes.length,
			}
		);
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function paginateNotes(req, res) {
	try {
		const { page, limit, skip } = parsePagination(req.query);
		const total = await Note.countDocuments();
		const notes = await Note.find().sort({ createdAt: -1 }).skip(skip).limit(limit);

		return sendSuccess(res, 200, "Notes fetched successfully", notes, {
			pagination: buildPagination(total, page, limit),
		});
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function paginateByCategory(req, res) {
	try {
		const { category } = req.params;

		if (!validateCategory(category)) {
			return sendError(res, 400, "Invalid category. Allowed: work, personal, study");
		}

		const { page, limit, skip } = parsePagination(req.query);
		const filter = { category };
		const total = await Note.countDocuments(filter);
		const notes = await Note.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

		return sendSuccess(res, 200, `Notes fetched for category: ${category}`, notes, {
			pagination: buildPagination(total, page, limit),
		});
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function sortNotes(req, res) {
	try {
		const sortConfig = buildSort(req.query);

		if (sortConfig.error) {
			return sendError(
				res,
				400,
				"Invalid sortBy. Allowed: title, createdAt, updatedAt, category"
			);
		}

		const notes = await Note.find().sort({ [sortConfig.sortBy]: sortConfig.order });

		return sendSuccess(
			res,
			200,
			`Notes sorted by ${sortConfig.sortBy} in ${sortConfig.direction} order`,
			notes,
			{
				count: notes.length,
			}
		);
	} catch (error) {
		return sendError(res, 500, error.message);
	}
}

async function sortPinnedNotes(req, res) {
	try {
		const sortConfig = buildSort(req.query);

		if (sortConfig.error) {
			return sendError(
				res,
				400,
				"Invalid sortBy. Allowed: title, createdAt, updatedAt, category"
			);
		}

		const notes = await Note.find({ isPinned: true }).sort({
			[sortConfig.sortBy]: sortConfig.order,
		});

		return sendSuccess(
			res,
			200,
			`Pinned notes sorted by ${sortConfig.sortBy} in ${sortConfig.direction} order`,
			notes,
			{
				count: notes.length,
			}
		);
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
	getNotesByCategory,
	getNotesByStatus,
	filterNotes,
	getPinnedNotes,
	filterByCategory,
	filterByDateRange,
	paginateNotes,
	paginateByCategory,
	sortNotes,
	sortPinnedNotes,
};