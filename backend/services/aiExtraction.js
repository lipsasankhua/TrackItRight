require('dotenv').config();

const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extractFromMessage(rawText) {
  const prompt = `You are analyzing a client message for a small business (could be a law firm, design agency, or architecture firm). Read the message and extract structured information.

Client message: "${rawText}"

Respond ONLY with valid JSON in exactly this format, nothing else, no markdown, no explanation:
{
  "entry_type": "deadline" or "task" or "extra_work",
  "summary": "a short one-line summary of the request",
  "due_date": "YYYY-MM-DD" or null if no date is mentioned,
  "billable": true or false,
  "estimated_value": a number if this is extra/unbilled work and a value can be reasonably estimated, otherwise null
}

Rules:
- "deadline" = client mentions or sets a due date for something
- "task" = a normal request or to-do, not extra/unplanned work
- "extra_work" = client is asking for something beyond the original scope (changes, additions, revisions not originally agreed)
- If unsure between task and extra_work, prefer extra_work only if it clearly sounds like scope creep
- due_date must be in YYYY-MM-DD format or null — never guess a date that isn't mentioned or clearly implied`;

  const response = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [{ role: 'user', content: prompt }],
  });

  const textOutput = response.choices[0].message.content;
  const cleaned = textOutput.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse Groq response:', textOutput);
    throw new Error('AI extraction returned invalid JSON');
  }
}

module.exports = { extractFromMessage };