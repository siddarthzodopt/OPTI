const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const ExcelJS = require("exceljs");

/* ================================
   S3 CLIENT
================================ */
const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/* ================================
   STREAM -> BUFFER
================================ */
const streamToBuffer = (stream) => {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
};

/* ================================
   READ EXCEL FROM S3 AS JSON
================================ */
const readExcelFromS3AsJson = async ({
  bucketName = "zodopt",
  key = "Leaddata/Leads by Status.xlsx",
  sheetName,
} = {}) => {
  if (!bucketName || !key) {
    throw new Error("bucketName and key are required");
  }

  // 1) Get file from S3
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const s3Data = await s3.send(command);

  if (!s3Data?.Body) {
    throw new Error("S3 returned empty file body");
  }

  // 2) Convert stream to buffer
  const buffer = await streamToBuffer(s3Data.Body);

  // 3) Load workbook
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // 4) Select sheet
  const sheet = sheetName
    ? workbook.getWorksheet(sheetName)
    : workbook.worksheets[0];

  if (!sheet) {
    const available = workbook.worksheets.map((s) => s.name).join(", ");
    throw new Error(`Sheet not found. Available sheets: ${available}`);
  }

  // 5) Read rows into arrays
  const rows = [];
  sheet.eachRow((row) => {
    rows.push(row.values.slice(1)); // remove empty index 0
  });

  if (rows.length < 2) {
    return [];
  }

  // 6) First row is header
  const headers = rows[0].map((h) => String(h || "").trim());

  // 7) Convert to JSON
  const json = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const obj = {};

    headers.forEach((header, idx) => {
      if (!header) return;
      obj[header] = row[idx] ?? "";
    });

    json.push(obj);
  }

  return json;
};

module.exports = { readExcelFromS3AsJson };
