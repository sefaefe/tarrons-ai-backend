export default async function handler(req, res) {
  try {
    const { prompt } = req.body;

    // 1) Prompt var mı ve string mi?
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 2) OpenAI API KEY var mı?
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is missing on server');
      return res.status(500).json({ error: 'Server config error: missing OPENAI_API_KEY' });
    }

    // 3) OpenAI image endpointine istek
    const aiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        n: 1,
      }),
    });

    // 4) HTTP status hatası
    if (!aiResponse.ok) {
      const errorText = await aiResponse.text().catch(() => "");
      console.error('OpenAI HTTP error:', aiResponse.status, errorText);
      return res.status(500).json({
        error: 'OpenAI HTTP error',
        status: aiResponse.status,
        details: errorText,
      });
    }

    const data = await aiResponse.json();

    // 5) Beklenen formatta data var mı?
    if (!data || !data.data || !data.data[0] || !data.data[0].url) {
      console.error('Unexpected OpenAI response structure:', data);
      return res.status(500).json({
        error: 'Unexpected OpenAI response',
        details: data,
      });
    }

    // 6) Başarılı cevap
    return res.status(200).json({ image_url: data.data[0].url });

  } catch (err) {
    console.error('AI generation failed:', err);
    return res.status(500).json({ error: 'AI generation failed', details: String(err) });
  }
}
