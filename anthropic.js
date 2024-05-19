// anthropic.js
const { InvokeModelCommand, BedrockRuntimeClient } = require("@aws-sdk/client-bedrock-runtime");
const fs = require('fs');

function createBedrockRuntimeClient() {
  return new BedrockRuntimeClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID,
      secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
  });
}

const modelsDict = [
  { id: "anthropic.claude-3-haiku-20240307-v1:0", name: "Haiku" }, 
  { id: "anthropic.claude-3-sonnet-20240229-v1:0", name: "Sonnet" }
];

function getModelId(modelName) {
  const model = modelsDict.find(model => model.name === modelName);
  return model ? model.id : null;
}

function createInvokeModelCommand(prompt, base64Image, modelId) {
    const content = [{
        type: 'image',
        source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64Image,
        }
    }];
    
    content.push({
        type: 'text',
        text: prompt,
    });
    
    return new InvokeModelCommand({
      body: JSON.stringify({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        temperature: 0.0,
        "messages": [
          {
            "role": "user",
            "content": content
          },
          {
            "role": "assistant",
            "content": "{"
          }
        ]
      }),
      contentType: "application/json",
      accept: "application/json",
      modelId: modelId,
    });
}

async function callAnthropicAPI(prompt, imageFile, model = "Haiku") {
  const client = createBedrockRuntimeClient();
  
  const imageBuffer = await fs.promises.readFile(imageFile);
  const base64Image = imageBuffer.toString('base64');

  const command = createInvokeModelCommand(prompt, base64Image, getModelId(model));
  const { body } = await client.send(command);
  return JSON.parse(Buffer.from(body, "base64").toString());
}

module.exports = {
  callAnthropicAPI
};