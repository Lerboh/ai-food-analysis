// AI Food Analysis API Endpoint
// Serverless function for analyzing food images with OpenAI

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Rate limiting: 3 analyses per IP per day
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || 'unknown';
    const rateLimitKey = `rate_limit_${clientIP}`;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Simple in-memory rate limiting (for production, use Redis or similar)
    // This is a basic implementation - in production, use a proper rate limiting service
    if (!global.rateLimitStore) {
        global.rateLimitStore = {};
    }
    
    const userLimit = global.rateLimitStore[rateLimitKey];
    if (userLimit && userLimit.date === today && userLimit.count >= 3) {
        return res.status(429).json({
            error: "Sorry — you've reached today's limit (3). Come back tomorrow."
        });
    }

    // Initialize or update rate limit
    if (!userLimit || userLimit.date !== today) {
        global.rateLimitStore[rateLimitKey] = { date: today, count: 0 };
    }
    global.rateLimitStore[rateLimitKey].count++;

    try {
        // Get OpenAI API key from environment variable
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            console.error('OPENAI_API_KEY environment variable not set');
            return res.status(500).json({
                error: 'Unable to analyze image. Please try a clearer photo.'
            });
        }

        // Get image from request body (expecting base64 encoded image)
        let imageBase64 = req.body?.image;

        if (!imageBase64) {
            return res.status(400).json({
                error: 'Image is required. Please upload a photo.'
            });
        }

        // Convert base64 to proper format if needed
        const imageData = imageBase64.startsWith('data:') 
            ? imageBase64.split(',')[1] 
            : imageBase64;

        // Call OpenAI Vision API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Using gpt-4o-mini (gpt-5-mini doesn't exist yet)
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyze this food image and provide:
1. A list of visible food ingredients (be specific, e.g., "Chicken breast" not just "Chicken")
2. Estimated calories, protein (g), carbs (g), and fat (g) for the entire meal shown

Be honest if you're uncertain about any ingredient or quantity. Return ONLY valid JSON in this exact format:
{
  "ingredients": ["Ingredient 1", "Ingredient 2", ...],
  "macros": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number
  }
}

Do not include any text outside the JSON.`
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:image/jpeg;base64,${imageData}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 500,
                temperature: 0.3
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.text();
            console.error('OpenAI API error:', errorData);
            return res.status(500).json({
                error: 'Unable to analyze image. Please try a clearer photo.'
            });
        }

        const openaiData = await openaiResponse.json();
        const aiMessage = openaiData.choices[0]?.message?.content;

        if (!aiMessage) {
            return res.status(500).json({
                error: 'Unable to analyze image. Please try a clearer photo.'
            });
        }

        // Parse JSON from AI response
        // The AI might return JSON wrapped in markdown code blocks
        let jsonText = aiMessage.trim();
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        let analysisResult;
        try {
            analysisResult = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse AI response:', jsonText);
            return res.status(500).json({
                error: 'Unable to analyze image. Please try a clearer photo.'
            });
        }

        // Validate response structure
        if (!analysisResult.ingredients || !Array.isArray(analysisResult.ingredients)) {
            return res.status(500).json({
                error: 'Unable to analyze image. Please try a clearer photo.'
            });
        }

        if (!analysisResult.macros || 
            typeof analysisResult.macros.calories !== 'number' ||
            typeof analysisResult.macros.protein !== 'number' ||
            typeof analysisResult.macros.carbs !== 'number' ||
            typeof analysisResult.macros.fat !== 'number') {
            return res.status(500).json({
                error: 'Unable to analyze image. Please try a clearer photo.'
            });
        }

        // Return successful response
        return res.status(200).json({
            ingredients: analysisResult.ingredients,
            macros: {
                calories: Math.round(analysisResult.macros.calories),
                protein: Math.round(analysisResult.macros.protein),
                carbs: Math.round(analysisResult.macros.carbs),
                fat: Math.round(analysisResult.macros.fat)
            }
        });

    } catch (error) {
        console.error('Error analyzing image:', error);
        return res.status(500).json({
            error: 'Unable to analyze image. Please try a clearer photo.'
        });
    }
}

