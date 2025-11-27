export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://tarrons.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const aiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        n: 1
      })
    });

    const data = await aiResponse.json();

    if (!data || !data.data || !data.data[0].url) {
      return res.status(500).json({ error: 'Invalid OpenAI response', details: data });
    }

    return res.status(200).json({ image_url: data.data[0].url });

  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({ error: 'Server error', details: error });
  }
}

