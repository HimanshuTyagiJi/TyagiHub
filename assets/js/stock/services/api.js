export const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxqXDvnxgzxFMFjUKtxX1Aa2unnpvPreNuH7cJ69cZURAE4LcHbVvn5FLsK41QAqN8l/exec";

/**
 * Clean unminified API Fetch helper for Google Apps Script requests
 * @param {string} url - The full Google Apps Script API endpoint
 * @returns {Promise<any>}
 */
export const fetchGAS = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }
  
  const text = await response.text();
  const trimmed = text.trim();
  
  if (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<script") ||
    trimmed.startsWith("<head") ||
    trimmed.startsWith("<body")
  ) {
    throw new Error(
      'Received HTML response instead of JSON. Please ensure that your Google Apps Script Web App is deployed with "Execute as: Me" and "Who has access: Anyone". If you are logged in with multiple Google accounts, try opening the App in incognito or another browser.'
    );
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Invalid JSON response from server. Error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
