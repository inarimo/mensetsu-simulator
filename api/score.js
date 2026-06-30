module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, systemPrompt } = req.body;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

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
      return res.status(500).json({ error: JSON.stringify(data) });
    }
    const text = data.candidates[0].content.parts[0].text;
    let clean = text.replace(/```json|```/g, '').trim();
    
    // JSONが途中で切れている場合の応急処置
    let result;
    try {
      result = JSON.parse(clean);
    } catch (parseErr) {
      // 閉じ括弧が足りない場合、補完を試みる
      const openBraces = (clean.match(/{/g) || []).length;
      const closeBraces = (clean.match(/}/g) || []).length;
      if (openBraces > closeBraces) {
        clean = clean + '"}'.repeat(openBraces - closeBraces);
      }
      result = JSON.parse(clean);
    }
    
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: e.message, score: 50, good: '回答を確認しました', improve: 'もう一度お試しください', hrVoice: 'システムエラーが発生しました', dialogue: 'ありがとうございます。', modelAnswer: '' });
  }
}
