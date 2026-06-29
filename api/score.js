module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, systemPrompt } = req.body;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: 'application/json' }
        })
      }
    );
    const data = await response.json();
    console.log('FULL RESPONSE:', JSON.stringify(data).substring(0, 500));
    res.status(200).json({ debug: JSON.stringify(data).substring(0, 500) });
  } catch (e) {
    console.log('ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
}
