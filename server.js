import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST endpoint for AI chat
app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;
    if (!conversation) return res.status(400).json({ reply: "No conversation received" });

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: conversation
        });

        const reply = response.choices[0].message.content;
        res.json({ reply });
    } catch (err) {
        console.error(err);
        res.status(500).json({ reply: "Error connecting to AI" });
    }
});

app.listen(port, () => console.log(`AI chat server running at http://localhost:${port}`));
