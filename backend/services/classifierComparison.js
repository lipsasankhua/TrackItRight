const CLASSIFIER_API_URL = process.env.CLASSIFIER_API_URL || 'http://localhost:8000';

/**
 * Calls the local Python FastAPI classifier service and returns its prediction.
 * If the service is unreachable (e.g. not running, or not deployed in production),
 * this fails gracefully and returns null instead of crashing the main extraction flow —
 * the trained classifier is a bonus comparison feature, not a required dependency.
 */
async function getClassifierPrediction(rawText) {
  try {
    const response = await fetch(`${CLASSIFIER_API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText }),
      signal: AbortSignal.timeout(3000), // don't let a slow/dead service hold up the main request
    });

    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    console.log('Classifier API unavailable, skipping comparison:', err.message);
    return null;
  }
}

module.exports = { getClassifierPrediction };