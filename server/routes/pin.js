const express = require("express");
const {
  createPin,
  getAllPins,
  getPinById,
  updatePinById,
  deletePinById,
  addReview,
  modifyReview,
  deleteReview,
  addVisitor,  // Import the incrementVisitCount controller
} = require("../controllers/pin");

const { isAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();

// Pin routes
router.route("/create-pin").post(isAuthenticatedUser, createPin);
router.route("/get-all-pins").get(isAuthenticatedUser, getAllPins);
router.route("/get-pin/:id").get(isAuthenticatedUser, getPinById);
router.route("/update-pin/:id").put(isAuthenticatedUser, updatePinById);
router.route("/delete-pin/:id").delete(isAuthenticatedUser, deletePinById);

// Review routes
router.route("/add-review").post(isAuthenticatedUser, addReview);
router.route("/modify-review").put(isAuthenticatedUser, modifyReview);
router.route("/delete-review").delete(isAuthenticatedUser, deleteReview);

// Visit count route
router.route("/add-visitor").post(isAuthenticatedUser, addVisitor);

module.exports = router;
  