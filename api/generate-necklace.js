export default async function handler(req, res) {
  try {
    const { prompt } = req.body;

    const aiResponse = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        prompt,
        size: "1024x1024"
      })
    });

    const data = await aiResponse.json();

    if (!data || !data.data) {
      return res.status(500).json({ error: "OpenAI response error", details: data });
    }

    return res.status(200).json({ image_url: data.data[0].url });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "AI generation failed" });
  }
}


