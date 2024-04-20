const express = require("express");
const router = express.Router();
const Report = require("../models/AcReport");
const { roles } = require("../models/User");
const authenticateUser = require("../middleware/authenticateUser");

router.use(authenticateUser);

router.post("/report", async (req, res) => {
  try {
    const momData = req.body;
    if (momData.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Forbidden - Unauthorized user" });
    }
    const newMom = await Report.create(momData);
    res.status(201).json(newMom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/get-report", async (req, res) => {
  try {
    const moms = await Report.find().populate("userId");
    res.status(200).json(moms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/get-report-by-id/:momId", async (req, res) => {
  try {
    const { momId } = req.params;
    console.log("momId::: ", momId);
    const mom = await Report.findById(momId).populate("userId");

    if (!mom) {
      return res.status(404).json({ error: "MOM not found" });
    }

    res.status(200).json(mom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/get-report/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userRoles = req.user?.roles || [];  

    if (userRoles.includes("admin")) {
      const moms = await Report.find().populate("userId");
      return res.status(200).json(moms);
    }

    if (userId !== req.user._id.toString()) {
      return res.status(403).json({ error: "Forbidden - Unauthorized user" });
    }

    let moms;
    const zoneRoles = [
      "Eastern Vidarbha",
      "Konkan",
      "Marathwada",
      "Mumbai",
      "Northern Maharashtra",
      "Thane + Palghar",
      "Western Maharashtra",
      "Western Vidarbha",
    ];

    const userZoneRoles = (userRoles || []).filter(role => zoneRoles.includes(role));

    if (userZoneRoles.length > 0) {
      moms = await Report.find({ zone: { $in: userZoneRoles } }).populate("userId");
    } else {
      moms = await Report.find({ userId }).populate("userId");
    }

    return res.status(200).json(moms);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


router.get("/get-report-by-party/:partyName", async (req, res) => {
  try {
    const { partyName } = req.params;
    const moms = await Report.find({ partyName }).populate("userId");

    const momCount = await Report.countDocuments({ partyName });

    res.status(200).json({ moms, momCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/get-report-by-constituency/:constituency", async (req, res) => {
  try {
    const { constituency } = req.params;

    const moms = await Report.find({ constituency }).populate("userId");

    const momCount = await Report.countDocuments({ constituency });

    res.status(200).json({ moms, momCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/get-report-by-zone/:zone", async (req, res) => {
  try {
    const { zone } = req.params;

    const moms = await Report.find({ zone });

    const momCount = await Report.countDocuments({ zone });

    res.status(200).json({ moms, momCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/get-report-by-pc/:pc", async (req, res) => {
  try {
    const { pc } = req.params;
    const moms = await Report.find({ pc }).populate("userId");

    const momCount = moms.length;

    res.status(200).json({ moms, momCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/get-all-moms-count", async (req, res) => {
  try {
    const { pc, constituency } = req.query;
    let moms;

    if (pc) {
      moms = await Report.find({ pc }).populate("userId");
    } else if (constituency) {
      moms = await Report.find({ constituency }).populate("userId");
    } else {
      moms = await Report.find({});
    }
    const momCount = moms.length;
    res.status(200).json({ moms, momCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/update-report/:momId", async (req, res) => {
  try {
    const { momId } = req.params;
    const updatedMom = await Report.findByIdAndUpdate(momId, req.body, {
      new: true,
    });
    res.status(200).json(updatedMom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/delete-report/:momId", async (req, res) => {
  try {
    const { momId } = req.params;
    const deletedMom = await Report.findByIdAndDelete(momId);
    if (!deletedMom) {
      return res.status(404).json({ error: "Report record not found" });
    }
    res.status(200).json({ message: "Report record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
