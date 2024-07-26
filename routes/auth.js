const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("../config");
const User = require("../models/User");
const Booth = require('../models/BoothList');

const router = express.Router();
router.post("/signup", async (req, res, next) => {
  try {
    const { userName, email, password, roles } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }
    const user = new User({ userName, email, password, roles });
    await user.save();
    const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
      expiresIn: "1d",
    });
    res.status(201).json({ message: "User created successfully", token });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { userName, email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    user.comparePassword(password, async function (err, isMatch) {
      if (err) {
        throw err;
      }

      if (!isMatch) {
        return res.status(401).json({ message: "Authentication failed" });
      }

      const token = jwt.sign({ userId: user._id }, config.jwtSecret, {
        expiresIn: "1d",
      });

      const userObj = {
        email: user.email,
        _id: user._id,
        roles: user.roles,
        userName: user.userName,
      };

      req.session.token = token;

      res.cookie("token", token, {
        maxAge: 36000000,
        sameSite: "none",
        secure: true,
        httpOnly: false,
      });

      res.status(200).json({ message: "Login success", userObj, token });
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const users = await User.find({}, { password: 0 });
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId, { password: 0 });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

router.put("/update-password", async (req, res, next) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    user.comparePassword(currentPassword, async (err, isMatch) => {
      if (err) throw err;

      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" });
      }
      user.password = newPassword;

      await user.save();
      const newToken = jwt.sign({ userId: user._id }, config.jwtSecret, {
        expiresIn: "1d",
      });

      res
        .status(200)
        .json({ message: "Password updated successfully", newToken });
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Function to add a user to the hierarchy
// function addUserToHierarchy(hierarchy, user, parent, roleKey) {
//   if (!parent[roleKey]) {
//     parent[roleKey] = [];
//   }

//   parent[roleKey].push(user);
// }

// // Function to find the parent node in the hierarchy
// function findParentNode(hierarchy, booth, level) {
//   let parent = hierarchy;

//   if (level >= 1) {
//     if (!parent[booth.zone]) {
//       parent[booth.zone] = {};
//     }
//     parent = parent[booth.zone];
//   }

//   if (level >= 2) {
//     if (!parent[booth.district]) {
//       parent[booth.district] = {};
//     }
//     parent = parent[booth.district];
//   }

//   if (level >= 3) {
//     if (!parent[booth.pc]) {
//       parent[booth.pc] = {};
//     }
//     parent = parent[booth.pc];
//   }

//   if (level >= 4) {
//     if (!parent[booth.constituency]) {
//       parent[booth.constituency] = [];
//     }
//     parent = parent[booth.constituency];
//   }

//   return parent;
// }

// // GET /api/hierarchy - Get the hierarchical tree of users
// router.get('/hierarchy', async (req, res) => {
//   try {
//     const users = await User.find().exec();
//     const booths = await Booth.find().populate('userId').exec();

//     const hierarchy = {};

//     users.forEach(user => {
//       user.roles.forEach(role => {
//         const booth = booths.find(booth => booth.userId && booth.userId._id.equals(user._id));

//         if (booth) {
//           if (role.includes('Zone')) {
//             addUserToHierarchy(hierarchy, user, hierarchy, role);
//           } else if (role.includes('District')) {
//             const parent = findParentNode(hierarchy, booth, 1);
//             addUserToHierarchy(hierarchy, user, parent, role);
//           } else if (role.includes('Constituency')) {
//             const parent = findParentNode(hierarchy, booth, 2);
//             addUserToHierarchy(hierarchy, user, parent, role);
//           } else {
//             const parent = findParentNode(hierarchy, booth, 3);
//             addUserToHierarchy(hierarchy, user, parent, role);
//           }
//         }
//       });
//     });

//     res.json(hierarchy);
//   } catch (error) {
//     console.error("Error fetching hierarchy:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });


module.exports = router;
