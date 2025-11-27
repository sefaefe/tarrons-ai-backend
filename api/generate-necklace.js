export default async function handler(req, res) {
  try {
    // Body JSON gelmezse diye ekstra koruma
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // OpenAI isteği
    const aiResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 🔥 ENV'DEN API KEY
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        n: 1
      })
    });

    const text = await aiResponse.text();

    // OpenAI hata verirse
    if (!aiResponse.ok) {
      console.error("OpenAI error status:", aiResponse.status);
      console.error("OpenAI error body:", text);

      return res.status(500).json({
        error: "openai_error",
        status: aiResponse.status,
        body: text
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse error:", e, text);
      return res.status(500).json({
        error: "invalid_json_from_openai",
        raw: text
      });
    }

    if (!data || !data.data || !data.data[0] || !data.data[0].url) {
      console.error("Unexpected OpenAI response format:", data);
      return res.status(500).json({
        error: "unexpected_openai_response",
        details: data
      });
    }

    // Başarılı cevap
    return res.status(200).json({ image_url: data.data[0].url });

  } catch (err) {
    console.error("AI generation failed:", err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}
