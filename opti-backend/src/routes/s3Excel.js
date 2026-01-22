const express = require("express");
const { readExcelFromS3AsJson } = require("../utils/s3ExcelReader");

const router = express.Router();

/**
 * GET /api/s3/excel
 * Optional query params:
 *  - bucket: S3 bucket name
 *  - key: S3 object key
 *  - sheet: Excel sheet name
 *
 * Example:
 * /api/s3/excel?bucket=zodopt&key=Leaddata/Leads%20by%20Status.xlsx
 */
router.get("/excel", async (req, res) => {
  try {
    const bucketName = req.query.bucket || "zodopt";
    const key = req.query.key || "Leaddata/Leads by Status.xlsx";
    const sheetName = req.query.sheet || undefined;

    const data = await readExcelFromS3AsJson({
      bucketName,
      key,
      sheetName,
    });

    return res.status(200).json({
      success: true,
      bucketName,
      key,
      sheetName: sheetName || null,
      total: data.length,
      data,
    });
  } catch (err) {
    console.error("❌ /api/s3/excel error:", err);

    // Better error messages for S3
    if (err?.name === "NoSuchKey" || err?.Code === "NoSuchKey") {
      return res.status(404).json({
        success: false,
        message: "File not found in S3 (NoSuchKey). Check bucket/key path.",
        error: err?.message,
      });
    }

    if (err?.name === "AccessDenied") {
      return res.status(403).json({
        success: false,
        message: "Access denied to S3. Check IAM permissions.",
        error: err?.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: err?.message || "Internal server error",
    });
  }
});

module.exports = router;
