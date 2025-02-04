const Report = require("../models/ReportModel");
const ErrorHandler = require("../utils/ErrorHandler.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// Create or increment a report
exports.createOrUpdateReport = catchAsyncErrors(async (req, res, next) => {
  try {
    const { userId, reportedItemId, itemType, reason } = req.body;

    // Validate required fields
    if (!userId || !reportedItemId || !itemType || !reason) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    // Check if a report already exists for the same item and type
    const existingReport = await Report.findOne({ reportedItemId, itemType });

    if (existingReport) {
      // Increment the report count if already reported
      await Report.incrementReportCount(reportedItemId, itemType);
      return res.status(200).json({
        success: true,
        message: "Report count incremented",
      });
    } else {
      // Create a new report
      const report = await Report.create({
        userId,
        reportedItemId,
        itemType,
        reason,
      });

      return res.status(201).json({
        success: true,
        message: "Report created successfully",
        report,
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get all reports
exports.getAllReports = catchAsyncErrors(async (req, res, next) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Get reports for a specific item
exports.getReportsByItem = catchAsyncErrors(async (req, res, next) => {
  try {
    const { reportedItemId, itemType } = req.params;

    const reports = await Report.find({ reportedItemId, itemType });

    if (!reports.length) {
      return next(new ErrorHandler("No reports found for this item", 404));
    }

    res.status(200).json({
      success: true,
      reports,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Delete a report by ID
exports.deleteReport = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await Report.findByIdAndDelete(id);

    if (!report) {
      return next(new ErrorHandler("Report not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});

// Delete all reports for a specific item
exports.deleteReportsByItem = catchAsyncErrors(async (req, res, next) => {
  try {
    const { reportedItemId, itemType } = req.params;

    const result = await Report.deleteMany({ reportedItemId, itemType });

    if (result.deletedCount === 0) {
      return next(new ErrorHandler("No reports found for this item", 404));
    }

    res.status(200).json({
      success: true,
      message: "Reports deleted successfully",
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
});
