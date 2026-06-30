module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, systemPrompt } = req.body;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  const fallback = {
    score: 50,
    verdict: "評価：中",
    active: "活躍可能性：中",
    good: "回答を受け取りました。",
    improve: "もう一度具体的にお話しください。",
    hrVoice: "もう少し詳しく聞きたいですね。",
    dialogue: "ありがとうございます。",
    modelAnswer: "",
    followUp: ""
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            response_mime_type: 'application/json',
            maxOutputTokens: 2000
          }
        })
      }
    );
    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]) {
      console.log('NO CANDIDATES:', JSON.stringify(data));
      return res.status(200).json(fallback);
    }
    
    const text = data.candidates[0].content.parts[0].text;
    let clean = text.replace(/```json|```/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(clean);
    } catch (parseErr) {
      const openBraces = (clean.match(/{/g) || []).length;
      const closeBraces = (clean.match(/}/g) || []).length;
      if (openBraces > closeBraces) {
        clean = clean + '"}'.repeat(openBraces - closeBraces);
      }
      try {
        result = JSON.parse(clean);
      } catch (e2) {
        console.log('PARSE FAILED:', clean.substring(0, 300));
        return res.status(200).json(fallback);
      }
    }
    
    res.status(200).json(result);
  } catch (e) {
    console.log('CATCH ERROR:', e.message);
    res.status(200).json(fallback);
  }
}
