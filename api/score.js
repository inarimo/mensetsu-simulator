module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, systemPrompt } = req.body;
  const GROQ_KEY = process.env.GROQ_API_KEY;
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

  // Groqで試みる
  async function tryGroq() {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1000
      })
    });
    const data = await res.json();
    if (!data.choices || !data.choices[0]) throw new Error('Groq failed');
    return JSON.parse(data.choices[0].message.content);
  }

  // Geminiで試みる
  async function tryGemini() {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: 'application/json', maxOutputTokens: 1000 }
        })
      }
    );
    const data = await res.json();
    if (!data.candidates || !data.candidates[0]) throw new Error('Gemini failed');
    const text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  }

  try {
    // まずGroqを試みる
    try {
      const result = await tryGroq();
      return res.status(200).json(result);
    } catch (e) {
      console.log('Groq failed, trying Gemini:', e.message);
    }

    // GroqがダメならGeminiを試みる
    try {
      const result = await tryGemini();
      return res.status(200).json(result);
    } catch (e) {
      console.log('Gemini failed, using fallback:', e.message);
    }

    // 両方ダメならフォールバック
    return res.status(200).json(fallback);

  } catch (e) {
    console.log('ERROR:', e.message);
    return res.status(200).json(fallback);
  }
}
