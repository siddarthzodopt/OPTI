const OpenAI = require("openai");
const { custom_models } = require("./models");

const DEFAULT_MODEL = process.env.LLM_MODEL || "llama-3.1-8b-instant";

const getModelConfig = (modelName) => {
  return custom_models.find((m) => m.model === modelName);
};

const getLLMClient = () => {
  const modelName = DEFAULT_MODEL;
  const config = getModelConfig(modelName);

  if (!config) {
    throw new Error(`Model config not found for: ${modelName}`);
  }

  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing in .env");
  }

  // ✅ OpenAI-compatible client for Groq
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: config.base_url,
  });

  return {
    client,
    model: config.model,
    model_display_name: config.model_display_name,
    provider: config.provider,
  };
};

module.exports = { getLLMClient };
