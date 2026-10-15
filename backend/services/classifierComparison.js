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

/**
 * Sends a human-confirmed correct label back to the classifier service as
 * training feedback — the active-learning loop: a flagged disagreement gets
 * resolved by a person, and that correction becomes a new labeled example
 * for the next retrain, instead of just being thrown away. Best-effort,
 * same as above — a resolution should still succeed even if the ML service
 * is offline.
 */
async function submitFeedback(text, label) {
  try {
    await fetch(`${CLASSIFIER_API_URL}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, label }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    console.log('Could not submit feedback to classifier API:', err.message);
  }
}

async function getFeedbackStatus() {
  try {
    const response = await fetch(`${CLASSIFIER_API_URL}/feedback/count`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (err) {
    return null;
  }
}

async function triggerRetrain() {
  const response = await fetch(`${CLASSIFIER_API_URL}/retrain`, {
    method: 'POST',
    signal: AbortSignal.timeout(30000), // retraining takes longer than a normal prediction
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Retrain failed');
  }
  return data;
}

module.exports = { getClassifierPrediction, submitFeedback, getFeedbackStatus, triggerRetrain };