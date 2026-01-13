// AI Food Analysis API Endpoint
// Serverless function for analyzing food images with OpenAI

export default async function handler(req, res) {
    // Log incoming request
    console.log('[API] Incoming request:', {
        method: req.method,
        hasBody: !!req.body,
        timestamp: new Date().toISOString()
    });

    // Wrap entire handler in try/catch to ensure JSON response
    try {
        // Only allow POST requests
        if (req.method !== 'POST') {
            console.log('[API] Method not allowed:', req.method);
            return res.status(405).json({ error: 'Method not allowed' });
        }

        // Check environment variable FIRST - before any other processing
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            console.error('[API] ERROR: OPENAI_API_KEY environment variable not set');
            return res.status(500).json({
                error: 'Missing OPENAI_API_KEY'
            });
        }

        // Rate limiting: 3 analyses per IP per day
        const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip || 'unknown';
        const rateLimitKey = `rate_limit_${clientIP}`;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        
        console.log('[API] Rate limit check for IP:', clientIP);
        
        // Simple in-memory rate limiting (for production, use Redis or similar)
        // This is a basic implementation - in production, use a proper rate limiting service
        if (!global.rateLimitStore) {
            global.rateLimitStore = {};
        }
        
        const userLimit = global.rateLimitStore[rateLimitKey];
        if (userLimit && userLimit.date === today && userLimit.count >= 3) {
            console.log('[API] Rate limit exceeded for IP:', clientIP);
            return res.status(429).json({
                error: "Sorry — you've reached today's limit (3). Come back tomorrow."
            });
        }

        // Initialize or update rate limit
        if (!userLimit || userLimit.date !== today) {
            global.rateLimitStore[rateLimitKey] = { date: today, count: 0 };
        }
        global.rateLimitStore[rateLimitKey].count++;

        // Get image from request body (expecting base64 encoded image)
        let imageBase64 = req.body?.image;

        if (!imageBase64) {
            console.log('[API] ERROR: No image in request body');
            return res.status(400).json({
                error: 'Image is required. Please upload a photo.'
            });
        }

        console.log('[API] Image received, length:', imageBase64.length);

        // Convert base64 to proper format if needed
        const imageData = imageBase64.startsWith('data:') 
            ? imageBase64.split(',')[1] 
            : imageBase64;

        // Call OpenAI Vision API
        console.log('[API] Calling OpenAI API...');
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

        console.log('[API] OpenAI response status:', openaiResponse.status, openaiResponse.statusText);

        if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error('[API] OpenAI API error:', {
                status: openaiResponse.status,
                statusText: openaiResponse.statusText,
                body: errorText
            });
            return res.status(500).json({
                error: 'Unable to analyze image. Please try a clearer photo.'
            });
        }

        // Safely parse OpenAI response
        let openaiData;
        try {
            const responseText = await openaiResponse.text();
            console.log('[API] OpenAI response text length:', responseText.length);
            openaiData = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[API] ERROR: Failed to parse OpenAI response:', parseError);
            return res.status(500).json({
                error: 'Unable to analyze image. Please try a clearer photo.'
            });
        }

        const aiMessage = openaiData.choices?.[0]?.message?.content;

        if (!aiMessage) {
            console.error('[API] ERROR: No message content in OpenAI response:', JSON.stringify(openaiData));
            return res.status(500).json({
                error: 'Unable to analyze image. Please try a clearer photo.'
            });
        }

        console.log('[API] OpenAI message received, length:', aiMessage.length);

        // Parse JSON from AI response
        // The AI might return JSON wrapped in markdown code blocks
        let jsonText = aiMessage.trim();
        if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '');
        }

        let analysisResult;
        try {
            analysisResult = JSON.parse(jsonText);
            console.log('[API] Successfully parsed AI response:', {
                ingredientsCount: analysisResult.ingredients?.length || 0,
                hasMacros: !!analysisResult.macros
            });
        } catch (parseError) {
            console.error('[API] ERROR: Failed to parse AI response JSON:', {
                error: parseError.message,
                jsonText: jsonText.substring(0, 200) // Log first 200 chars
            });
            return res.status(500).json({
                error: 'Unable to analyze image. Please try a clearer photo.'
            });
        }

        // Validate response structure
        if (!analysisResult.ingredients || !Array.isArray(analysisResult.ingredients)) {
            console.error('[API] ERROR: Invalid ingredients in response:', analysisResult);
            return res.status(500).json({
                error: 'Unable to analyze image. Please try a clearer photo.'
            });
        }

        if (!analysisResult.macros || 
            typeof analysisResult.macros.calories !== 'number' ||
            typeof analysisResult.macros.protein !== 'number' ||
            typeof analysisResult.macros.carbs !== 'number' ||
            typeof analysisResult.macros.fat !== 'number') {
            console.error('[API] ERROR: Invalid macros in response:', analysisResult.macros);
            return res.status(500).json({
                error: 'Unable to analyze image. Please try a clearer photo.'
            });
        }

        // Prepare successful response
        const finalResponse = {
            ingredients: analysisResult.ingredients,
            macros: {
                calories: Math.round(analysisResult.macros.calories),
                protein: Math.round(analysisResult.macros.protein),
                carbs: Math.round(analysisResult.macros.carbs),
                fat: Math.round(analysisResult.macros.fat)
            }
        };

        console.log('[API] Success! Returning response:', {
            ingredientsCount: finalResponse.ingredients.length,
            calories: finalResponse.macros.calories
        });

        // Return successful response - ALWAYS JSON
        return res.status(200).json(finalResponse);

    } catch (error) {
        // Catch-all error handler - ensures JSON is ALWAYS returned
        console.error('[API] ERROR: Unhandled exception:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // ALWAYS return JSON, even on unexpected errors
        return res.status(500).json({
            error: 'Unable to analyze image. Please try a clearer photo.'
        });
    }
}

