const { getLLMClient } = require("../config/llm");
const { readExcelFromS3AsJson } = require("../utils/s3ExcelReader");

const chatWithExcel = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "message is required" });
    }

    const leadsData = await readExcelFromS3AsJson({
      bucketName: "zodopt",
      key: "Leaddata/Leads by Status.xlsx",
    });

    const sampleRows = leadsData.slice(0, 20);

    const { client, model, provider, model_display_name } = getLLMClient();

    const messages = [
      { role: "system", content: "You are OPTI, a sales assistant. Answer using the lead dataset." },
    ];

    if (Array.isArray(history) && history.length > 0) {
      const trimmed = history.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      messages.push(...trimmed);
    }

    messages.push({
      role: "user",
      content: `Question: ${message}\n\nLeads sample:\n${JSON.stringify(sampleRows, null, 2)}`,
    });

    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
    });

    const reply = completion.choices?.[0]?.message?.content || "No response";

    return res.json({
      success: true,
      provider,
      model_display_name,
      reply,
    });
  } catch (err) {
    console.error("❌ LLM Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { chatWithExcel };
