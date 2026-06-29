
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
    
    if (!data.candidates || !data.candidates[0]) {
      return res.status(200).json({ 
        score: 50, debug: JSON.stringify(data)
      });
    }
    
    const text = data.candidates[0].content.parts[0].text;
    // デバッグ：テキストをそのまま返す
    return res.status(200).json({ 
      score: 50, 
      debug_text: text,
      debug_raw: text.substring(0, 500)
    });
    
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
    }
    
