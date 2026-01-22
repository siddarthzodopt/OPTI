const express = require("express");
const { sendMail } = require("../utils/mailSender");
const { draftEmailWithLLM } = require("../utils/draftEmailWithLLM");

const router = express.Router();

// ✅ Validation middleware
const validateEmailFields = (requiredFields) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }
    next();
  };
};

// ✅ Email validation helper
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * POST /api/mail/draft
 * 
 * Generates a fully dynamic AI-drafted email based on any context
 * 
 * @body {
 *   "context": {
 *     "recipientName": "Ravi Kumar",
 *     "recipientCompany": "Zodopt",
 *     "recipientRole": "CTO",
 *     "relationship": "warm lead",
 *     "previousInteraction": "Met at tech conference last week",
 *     ...any other context
 *   },
 *   "prompt": "Write a follow-up email proposing a technical demo of our AI platform"
 * }
 * 
 * @returns {
 *   "success": true,
 *   "draft": {
 *     "subject": "...",
 *     "html": "...",
 *     "text": "..."
 *   }
 * }
 */
router.post("/draft", validateEmailFields(["prompt"]), async (req, res) => {
  try {
    const { context = {}, prompt } = req.body;

    console.log(`📝 Generating dynamic email with context:`, Object.keys(context));

    const draft = await draftEmailWithLLM({
      context,
      userPrompt: prompt,
    });

    return res.json({ 
      success: true, 
      draft,
      message: "✅ Email draft generated successfully"
    });

  } catch (err) {
    console.error("❌ Draft Email Error:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to generate email draft",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

/**
 * POST /api/mail/send
 * 
 * Sends a pre-composed email with full customization
 * 
 * @body {
 *   "to": "lead@example.com" | ["lead1@example.com", "lead2@example.com"],
 *   "cc": "manager@example.com" (optional),
 *   "bcc": "archive@example.com" (optional),
 *   "subject": "Your Subject",
 *   "html": "<div>Body</div>",
 *   "text": "Body text (optional)",
 *   "attachments": [] (optional)
 * }
 */
router.post("/send", validateEmailFields(["to", "subject"]), async (req, res) => {
  try {
    const { to, cc, bcc, subject, html, text, attachments = [] } = req.body;

    // ✅ Validate email formats
    const allRecipients = [
      ...(Array.isArray(to) ? to : [to]),
      ...(cc ? (Array.isArray(cc) ? cc : [cc]) : []),
      ...(bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [])
    ];

    const invalidEmails = allRecipients.filter(email => !isValidEmail(email));
    
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid email address(es): ${invalidEmails.join(", ")}`,
      });
    }

    // ✅ Require at least one content type
    if (!html && !text) {
      return res.status(400).json({ 
        success: false, 
        message: "Either 'html' or 'text' content is required" 
      });
    }

    console.log(`📧 Sending email to: ${allRecipients.join(", ")}`);

    const mailOptions = {
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html: html || `<div style="font-family: Arial, sans-serif; white-space: pre-wrap;">${text}</div>`,
      text: text || "",
    };

    // ✅ Add optional fields
    if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(", ") : cc;
    if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(", ") : bcc;
    if (attachments.length > 0) mailOptions.attachments = attachments;

    const info = await sendMail(mailOptions);

    return res.json({
      success: true,
      message: `✅ Email sent successfully to ${allRecipients.length} recipient(s)`,
      messageId: info.messageId,
      recipients: allRecipients.length,
    });

  } catch (err) {
    console.error("❌ Send Email Error:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to send email",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

/**
 * POST /api/mail/send-dynamic-email
 * 
 * Generate and send a fully dynamic email based on any context
 * No restrictions on format or structure - completely flexible
 * 
 * @body {
 *   "to": "lead@example.com",
 *   "cc": "manager@example.com" (optional),
 *   "bcc": "archive@example.com" (optional),
 *   "context": {
 *     "recipientName": "Ravi Kumar",
 *     "recipientCompany": "Zodopt",
 *     "purpose": "partnership proposal",
 *     "tone": "professional but friendly",
 *     "urgency": "high",
 *     "callToAction": "schedule a call this week",
 *     ...any other context you want to include
 *   },
 *   "prompt": "Write an email proposing a strategic partnership for our AI solutions",
 *   "attachments": [] (optional)
 * }
 */
router.post("/send-dynamic-email", validateEmailFields(["to", "prompt"]), async (req, res) => {
  try {
    const { 
      to, 
      cc,
      bcc,
      context = {}, 
      prompt,
      attachments = []
    } = req.body;

    // ✅ Validate email formats
    const allRecipients = [
      ...(Array.isArray(to) ? to : [to]),
      ...(cc ? (Array.isArray(cc) ? cc : [cc]) : []),
      ...(bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [])
    ];

    const invalidEmails = allRecipients.filter(email => !isValidEmail(email));
    
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid email address(es): ${invalidEmails.join(", ")}`,
      });
    }

    console.log(`📧 Generating dynamic email with context:`, Object.keys(context));

    // ✅ Step 1: Generate dynamic email using AI
    const draft = await draftEmailWithLLM({
      context,
      userPrompt: prompt,
    });

    console.log(`✅ Draft generated - Subject: ${draft.subject}`);

    // ✅ Step 2: Send email with full customization
    const mailOptions = {
      to: Array.isArray(to) ? to.join(", ") : to,
      subject: draft.subject,
      html: draft.html,
      text: draft.text || "",
    };

    // ✅ Add optional fields
    if (cc) mailOptions.cc = Array.isArray(cc) ? cc.join(", ") : cc;
    if (bcc) mailOptions.bcc = Array.isArray(bcc) ? bcc.join(", ") : bcc;
    if (attachments.length > 0) mailOptions.attachments = attachments;

    const info = await sendMail(mailOptions);

    console.log(`✅ Email sent successfully - Message ID: ${info.messageId}`);

    return res.json({
      success: true,
      message: `✅ Email generated and sent to ${allRecipients.length} recipient(s)`,
      messageId: info.messageId,
      draft: {
        subject: draft.subject,
        preview: draft.text 
          ? draft.text.substring(0, 200) + "..." 
          : draft.html.replace(/<[^>]*>/g, "").substring(0, 200) + "...",
      },
      recipients: {
        to: Array.isArray(to) ? to : [to],
        cc: cc ? (Array.isArray(cc) ? cc : [cc]) : [],
        bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [],
      },
      context: Object.keys(context),
    });

  } catch (err) {
    console.error("❌ send-dynamic-email Error:", err.message);
    
    const errorContext = err.message.includes("draft") || err.message.includes("LLM")
      ? "generating email content" 
      : err.message.includes("send") || err.message.includes("SMTP")
      ? "sending email"
      : "processing request";

    return res.status(500).json({ 
      success: false, 
      message: `Failed ${errorContext}`,
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

/**
 * POST /api/mail/send-lead-email
 * 
 * Legacy endpoint for backward compatibility
 * Transforms old lead-based format to new dynamic format
 */
router.post("/send-lead-email", validateEmailFields(["to", "prompt"]), async (req, res) => {
  try {
    const { 
      to, 
      leadName, 
      company, 
      leadStatus, 
      prompt,
      ...additionalContext
    } = req.body;

    // ✅ Transform to dynamic context
    const context = {
      recipientName: leadName,
      recipientCompany: company,
      leadStatus,
      ...additionalContext, // Allow any additional context
    };

    // ✅ Forward to dynamic endpoint logic
    console.log(`📧 Processing lead email (using dynamic engine)`);

    const draft = await draftEmailWithLLM({
      context,
      userPrompt: prompt,
    });

    const info = await sendMail({
      to,
      subject: draft.subject,
      html: draft.html,
      text: draft.text || "",
    });

    return res.json({
      success: true,
      message: `✅ Email generated and sent`,
      messageId: info.messageId,
      draft: {
        subject: draft.subject,
        body: draft.text || draft.html.replace(/<[^>]*>/g, "").substring(0, 200) + "...",
      },
    });

  } catch (err) {
    console.error("❌ send-lead-email Error:", err.message);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to send email",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});

/**
 * GET /api/mail/health
 * 
 * Health check endpoint
 */
router.get("/health", async (req, res) => {
  try {
    const isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
    
    return res.json({
      success: true,
      configured: isConfigured,
      message: isConfigured 
        ? "✅ Email service is configured" 
        : "⚠️ SMTP credentials missing in environment variables",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Email service health check failed",
    });
  }
});

module.exports = router;