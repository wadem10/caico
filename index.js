const { google } = require('googleapis');
const axios = require('axios');
const path = require('path');

async function fetchGoogleSheetData(sheetId, range) {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'recs-435322-9d524ef84335.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: range,
  });

  return response.data.values;
}

async function fetchOpenAIPreferences(apiKey, preferences) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an assistant that provides highly personalized and creative music recommendations. Focus on the artistic and emotional aspects of the given songs to identify new recommendations that align thematically, stylistically, or emotionally. Your goal is to provide fresh, diverse, and meaningful song suggestions." },
        { 
          role: "user", 
          content: `Given these preferences: ${JSON.stringify(preferences)}, recommend 5 new songs in JSON format as an array of objects like [{"song": "Title", "artist": "Artist"}] do not include any other text in your response.` 
        }
      ],
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // Clean up the response content
  const rawContent = response.data.choices[0].message.content;
  console.log("OpenAI API Response:", rawContent);

  // Remove Markdown-style code fencing if present
  const cleanedContent = rawContent.replace(/```json|```/g, "").trim();
  return cleanedContent;
}

exports.handler = async (event) => {
  try {
    // Retrieve parameters from queryStringParameters
    const sheetId = event.queryStringParameters?.sheetId || '1yMiVxDV4uTuCNKnWTUw3b2qqaWF2aiUgJB4HBgdjAKM';
    const range = event.queryStringParameters?.range || 'Sheet1!A1:B10';

    // Fetch preferences from Google Sheets
    const preferences = await fetchGoogleSheetData(sheetId, range);

    // Retrieve OpenAI API Key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error("Missing OpenAI API key in environment variables");
    }

    // Fetch music recommendations from OpenAI
    const musicRecommendationsRaw = await fetchOpenAIPreferences(openaiApiKey, preferences);

    // Validate and parse the OpenAI response
    let musicRecommendations;
    try {
      musicRecommendations = JSON.parse(musicRecommendationsRaw);
    } catch (parseError) {
      console.error("Invalid JSON from OpenAI:", musicRecommendationsRaw);
      throw new Error("Invalid JSON format in OpenAI response");
    }

    // Return the response with CORS headers
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({
        googleSheetData: preferences,
        musicRecommendations: musicRecommendations,
      }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Failed to fetch data', details: error.message }),
    };
  }
};

