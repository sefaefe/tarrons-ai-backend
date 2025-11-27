export default async function handler(req, res) {
  // CORS ayarları
  res.setHeader('Access-Control-Allow-Origin', 'https://tarrons.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('Config error: OPENAI_API_KEY is missing');
      return res
        .status(500)
        .json({ error: 'Server config error: OPENAI_API_KEY is missing' });
    }

    const aiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1-mini",
        prompt,
        size: '1024x1024',
        n: 1,
      }),
    });

    const data = await aiResponse.json();

    // OpenAI tarafı hata dönerse
    if (!aiResponse.ok) {
      console.error('OpenAI error status:', aiResponse.status);
      console.error('OpenAI error body:', JSON.stringify(data));
      return res.status(500).json({
        error: 'OpenAI error',
        details: data,
      });
    }

    // Beklenen format yoksa
    if (!data.data || !data.data[0] || !data.data[0].url) {
      console.error('Unexpected OpenAI response:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Unexpected OpenAI response',
        details: data,
      });
    }

    // Başarılı cevap
    return res.status(200).json({ image_url: data.data[0].url });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({
      error: 'Server error',
      details: err?.message || String(err),
    });
  }
}
