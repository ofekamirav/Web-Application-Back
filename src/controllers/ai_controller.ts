import { Request, Response } from 'express';
import axios, { AxiosError } from 'axios';

async function suggestRecipe(req: Request, res: Response): Promise<void> {
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        res.status(400).json({ message: 'Ingredients must be a non-empty array.' });
        return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        res.status(500).json({ message: 'AI service is not configured.' });
        return;
    }

    const prompt = `Based on these ingredients: ${ingredients.join(', ')}. Suggest a recipe. Provide a response in a valid JSON format with three keys: "title" (string), "description" (string, up to 20 words), and "instructions" (an array of strings, where each string is a detailed step).`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
            { 
                contents: [{ parts: [{ text: prompt }] }] 
            },
            {
                timeout: 30000, // 30 second timeout
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!rawText) {
            res.status(500).json({ message: 'Invalid response from AI service.' });
            return;
        }

        const jsonText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const recipeSuggestion = JSON.parse(jsonText);
            res.status(200).json(recipeSuggestion);
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            res.status(500).json({ message: 'Failed to parse AI response.' });
            return;
        }
        
    } catch (error) {
        console.error('AI service error:', error);
        
        if (error instanceof AxiosError) {
            if (error.response?.status === 429) {
                res.status(429).json({ message: 'AI service rate limit exceeded. Please try again later.' });
                return;
            }
            if (error.response?.status === 401) {
                res.status(500).json({ message: 'AI service authentication failed.' });
                return;
            }
        }
        
        res.status(500).json({ message: 'Failed to generate recipe suggestion.' });
    }
};

export default { suggestRecipe };