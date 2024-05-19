const { OpenAI } = require("openai");
const fs = require('fs');

const openai = new OpenAI();

// Dictionary to map model names to OpenAI models
const modelsDict = [
  { id: "gpt-4-turbo", name: "GPT4" }, 
  { id: "gpt-4o", name: "GPT4o" }
];

function getModelId(modelName) {
  const model = modelsDict.find(model => model.name === modelName);
  return model ? model.id : null;
}

async function callOpenAIAPI(prompt, imageFile, model = "GPT4o") {
  // Read and convert image to base64
  const imageBuffer = await fs.promises.readFile(imageFile);
  const base64Image = imageBuffer.toString('base64');

  // Create messages array for OpenAI API
  const messages = [
    {
      role: "system",
      content: "You are a helpful assistant."
    },
    {
      role: "user",
      content: [ 
        {
          type: "text",
          text: prompt,
        },
        {
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${base64Image})` }
        }
      ]
    }
  ];

  const completion = await openai.chat.completions.create({
    messages: messages,
    model: getModelId(model),
  });

  //console.log(completion);

  return completion;
}

module.exports = {
  callOpenAIAPI
};