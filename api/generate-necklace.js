export default async function handler(req, res) {
  // Sadece bu origin’den gelen istekleri kabul et
  const allowedOrigin = "https://tarrons.com";

  // CORS header’ları (hem OPTIONS hem POST için geçerli olacak)
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight (OPTIONS) isteğini hemen geri döndür
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Sadece POST’e izin ver
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // OpenAI image endpoint
    const aiResponse = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt,
          size: "1024x1024",
          n: 1,
        }),
      }
    );

    const data = await aiResponse.json();

    // OpenAI tarafında hata varsa
    if (!aiResponse.ok) {
      console.error("OpenAI error:", aiResponse.status, data);
      return res
        .status(500)
        .json({ error: "OpenAI error", details: data });
    }

    // Beklediğimiz formatta URL yoksa
    if (!data.data || !data.data[0] || !data.data[0].url) {
      console.error("Unexpected OpenAI response:", data);
      return res.status(500).json({
        error: "Unexpected OpenAI response",
        details: data,
      });
    }

    // Başarılı cevap
    return res.status(200).json({ image_url: data.data[0].url });
  } catch (err) {
    console.error("AI generation failed", err);
    return res
      .status(500)
      .json({ error: "AI generation failed", details: String(err) });
  }
}
