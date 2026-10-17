const axios = require('axios');
const { AI_SERVICE_URL, AI_SERVICE_TOKEN } = require('../config/env');

const aiServiceClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
    'x-internal-service-key': AI_SERVICE_TOKEN
  }
});

/**
 * Sends analysis request to FastAPI internal orchestrator.
 */
const analyzeQuestion = async ({ question, datasetId, tableName, preferredLanguage, requestId }) => {
  try {
    const response = await aiServiceClient.post(
      '/internal/analyze',
      {
        question,
        dataset_id: datasetId,
        table_name: tableName,
        preferred_language: preferredLanguage || 'en',
        request_id: requestId
      },
      {
        headers: {
          'x-request-id': requestId
        }
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || error.response.data.message || 'AI Service Error');
    } else if (error.request) {
      throw new Error('AI Service is currently unreachable. Please ensure the Python service is running on port 8000.');
    } else {
      throw new Error(`AI Service request error: ${error.message}`);
    }
  }
};

/**
 * Fetches preview rows directly through FastAPI execute endpoint.
 */
const previewDatasetTable = async (tableName, limit = 20) => {
  try {
    const response = await aiServiceClient.post('/internal/sql/execute', {
      sql: `SELECT * FROM ${tableName} LIMIT ${limit};`,
      max_rows: limit
    });
    return response.data;
  } catch (error) {
    console.error(`Preview error for ${tableName}:`, error.message);
    return { success: false, rows: [], columns: [] };
  }
};

/**
 * Health check on Python AI Service.
 */
const checkAiServiceHealth = async () => {
  try {
    const res = await aiServiceClient.get('/health', { timeout: 3000 });
    return res.data;
  } catch (error) {
    return { status: 'unreachable', error: error.message };
  }
};

module.exports = {
  analyzeQuestion,
  previewDatasetTable,
  checkAiServiceHealth
};
