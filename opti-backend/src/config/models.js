const custom_models = [
  {
    model_display_name: "Kimi K2 [Groq]",
    model: "moonshotai/kimi-k2-instruct-0905",
    provider: "groq",
    base_url: "https://api.groq.com/openai/v1",
  },
  {
    model_display_name: "Llama 3.1 8B Instant [Groq]",
    model: "llama-3.1-8b-instant",
    provider: "groq",
    base_url: "https://api.groq.com/openai/v1",
  },
];

module.exports = { custom_models };
