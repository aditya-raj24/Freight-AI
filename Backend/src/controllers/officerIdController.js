const OfficerId = require("../models/officerId");
const AuditLog = require("../models/auditLog");

// Get all officer IDs
exports.getAllOfficerIds = async (req, res) => {
  try {
    const ids = await OfficerId.find()
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });
    return res.json(ids);
  } catch (error) {
    console.error("Get officer IDs error:", error);
    return res.status(500).json({ error: "Server error retrieving Officer IDs list." });
  }
};

// Create a new officer ID
exports.createOfficerId = async (req, res) => {
  try {
    const { govId, name } = req.body;

    if (!govId || !name) {
      return res.status(400).json({ error: "Please provide both Government ID and name." });
    }

    const trimmedGovId = govId.trim().toUpperCase();

    const exists = await OfficerId.findOne({ govId: trimmedGovId });
    if (exists) {
      return res.status(400).json({ error: "Officer ID already exists." });
    }

    const newId = await OfficerId.create({
      govId: trimmedGovId,
      name: name.trim()
    });

    // Write to audit log
    await AuditLog.create({
      action: `Created allowed Government Officer ID: ${trimmedGovId}`,
      user: req.user ? req.user.name : "System"
    });

    return res.status(201).json(newId);
  } catch (error) {
    console.error("Create officer ID error:", error);
    return res.status(500).json({ error: "Server error creating Officer ID." });
  }
};

// Delete an officer ID
exports.deleteOfficerId = async (req, res) => {
  try {
    const { id } = req.params;

    const officerIdDoc = await OfficerId.findById(id);
    if (!officerIdDoc) {
      return res.status(404).json({ error: "Officer ID not found." });
    }

    // Write to audit log before delete
    await AuditLog.create({
      action: `Deleted allowed Government Officer ID: ${officerIdDoc.govId}`,
      user: req.user ? req.user.name : "System"
    });

    await OfficerId.findByIdAndDelete(id);

    return res.json({ message: "Officer ID removed successfully." });
  } catch (error) {
    console.error("Delete officer ID error:", error);
    return res.status(500).json({ error: "Server error deleting Officer ID." });
  }
};
