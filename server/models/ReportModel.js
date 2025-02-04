const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // ID of the user reporting the post or pin
      required: true,
    },
    reportedItemId: {
      type: String, // Could be postId or pinId, used to store the ID of the reported item
      required: true,
    },
    itemType: {
      type: String, // 'post' or 'pin' to specify what is being reported
      required: true,
    },
    reason: {
      type: String, // Reason why it was reported
      required: true,
    },
    reportDate: {
      type: Date, // The date and time when it was reported
      default: Date.now,
    },
    reportCount: {
      type: Number, // Keeps track of how many people have reported the same post or pin
      default: 1, // The initial report will be counted as 1
    },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt` fields
);

reportSchema.index({ reportedItemId: 1, itemType: 1 }); // Index to handle frequent searches by reported item

// Method to increment the report count when another report is made for the same item
reportSchema.statics.incrementReportCount = async function (reportedItemId, itemType) {
  const report = await this.findOne({ reportedItemId, itemType });

  if (report) {
    report.reportCount += 1;
    await report.save();
  } else {
    // If no report exists, create a new report record
    await this.create({
      reportedItemId,
      itemType,
      reportCount: 1,
    });
  }
};

module.exports = mongoose.model("Report", reportSchema);
