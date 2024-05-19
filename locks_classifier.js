#!/usr/bin/env bun
const { callAnthropicAPI } = require('./anthropic');
const { callOpenAIAPI } = require('./gpt4');
const fs = require('fs');
const { program } = require('commander');

// Define the command line options
program
  .option('-m, --model <name>', 'Name of the model to use', 'Sonnet')
  .option('-v, --verbose', 'Enable verbose output')
  .parse(process.argv);
program.parse();
const options = program.opts();

console.log(`🤖 ${options.model}`);

const imageDir = 'images/'; 
const imageFiles = await fs.promises.readdir(imageDir);
// Sort the imageFiles array alphabetically
imageFiles.sort();
let i = 0;

function isResponseCorrect(response, file) {
  let text;
    if (options.model.startsWith('GPT')) {
      text = response.choices[0].message.content.toLowerCase();
      //console.log(response.choices[0].message.content);
    } else {
      text = response.content[0].text.toLowerCase();
      //console.log("{"+response.content[0].text);
    }
    const fileName = file.toLowerCase();
  
    if ((text.includes("true") && fileName.includes("_v")) ||
        (text.includes("false") && fileName.includes("_h"))) {
      return true;
    } else {
      return false;
    }
}

let totalInputTokens = 0;
let totalOutputTokens = 0;
let totalResponseTime = 0;
let totalImages = 0;
let correctResponses = 0;

for (const file of imageFiles) { 
    if (file.startsWith('test') && file.endsWith('.jpg')) {
        const llImageFile = `${imageDir}${file}`;

        const startTime = performance.now();

        // Add the specific image to the array
        let response;
        if (options.model.startsWith('GPT')) {
          response = await callOpenAIAPI(`The image attached shows a handle for a door. 
            Is the handle vertical (locked: true) or horizontal (locked: false)? Respond only with a JSON with property 'locked'.
            Don't add any additional information.`,
            llImageFile, options.model);
        } else {
          response = await callAnthropicAPI(`The image attached shows a handle for a door. 
            Is the handle vertical (locked: true) or horizontal (locked: false)? Respond only with a JSON with property 'locked'.
            Don't add any additional information.`,
            llImageFile, options.model);
        }

        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        if (options.verbose) {
          console.log(`${llImageFile} ${isResponseCorrect(response, file) ? '✅' : '❌'}`);
          if (options.model.startsWith('GPT')) {
            console.log(`📊 In: ${response.usage.prompt_tokens} tkn Out: ${response.usage.completion_tokens} Time: ${responseTime} ms`);
          } else {  
            console.log(`📊 In: ${response.usage.input_tokens} tkn Out: ${response.usage.output_tokens} Time: ${responseTime} ms`);
          }
        }

        if (options.model.startsWith('GPT')) {
          totalInputTokens += response.usage.prompt_tokens;
          totalOutputTokens += response.usage.completion_tokens;
        } else {
          totalInputTokens += response.usage.input_tokens;
          totalOutputTokens += response.usage.output_tokens;
        }

        totalResponseTime += responseTime;
        totalImages++;
        if (isResponseCorrect(response, file)) {
          correctResponses++;
        }
    }
} 

const averageResponseTime = Math.round(totalResponseTime / totalImages);
const correctPercentage = Math.round((correctResponses / totalImages) * 100);

console.log(`\nResponses: (${correctResponses} / ${totalImages}) ${correctPercentage}% Total In Tokens: ${totalInputTokens} Total Out Tokens: ${totalOutputTokens} Avg Time: ${averageResponseTime} ms`);