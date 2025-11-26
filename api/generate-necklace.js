// api/generate-necklace.js

export default async function handler(req, res) {
  // Sadece POST kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    // OpenAI IMAGES / GENERATIONS endpoint
    const aiResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024'
      })
    });

    const data = await aiResponse.json();

    // OpenAI tarafında hata varsa
    if (!aiResponse.ok) {
      console.error('OpenAI error', aiResponse.status, data);
      return res.status(500).json({ error: 'OpenAI response error', details: data });
    }

    // Beklediğimiz formatta URL yoksa
    if (!data || !data.data || !data.data[0] || !data.data[0].url) {
      console.error('Unexpected OpenAI response format', data);
      return res.status(500).json({ error: 'Invalid OpenAI response', details: data });
    }

    // Başarılı cevap
    return res.status(200).json({ image_url: data.data[0].url });

  } catch (err) {
    console.error('AI generation failed', err);
    return res.status(500).json({ error: 'AI generation failed' });
  }
}
