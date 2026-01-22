const { getLLMClient } = require("../config/llm");

const draftEmailWithLLM = async ({ leadName, company, leadStatus, userPrompt }) => {
  const { client, model } = getLLMClient();

  const systemPrompt = `
You are an expert sales email copywriter.
Return ONLY valid JSON with these keys:
subject, html, text

Rules:
- Professional tone
- Short & clear
- Email-safe HTML (inline/simple)
- No markdown or code block formatting
`;

  const userContent = `
Lead Name: ${leadName || "N/A"}
Company: ${company || "N/A"}
Lead Status: ${leadStatus || "N/A"}

User request: ${userPrompt}

Return JSON:
{
  "subject": "...",
  "html": "...",
  "text": "..."
}
`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    temperature: 0.6,
  });

  const raw = completion.choices?.[0]?.message?.content || "{}";

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error("LLM did not return valid JSON email output");
  }

  if (!parsed.subject || !parsed.html) {
    throw new Error("Email draft missing subject/html");
  }

  return parsed;
};

module.exports = { draftEmailWithLLM };
