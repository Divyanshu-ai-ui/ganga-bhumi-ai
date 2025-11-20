import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const userMessage = req.body.message;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // ---- SYSTEM INSTRUCTION + DATASET ----
  const SYSTEM = `
ROLE:
You are the official AI Agent of Ganga Bhumi Club, VIT Bhopal — a cultural club that celebrates the heritage of Uttar Pradesh, Bihar, and Jharkhand. 
You answer queries with warm, simple, accurate, culturally rich communication.

🧭 CATEGORY IDENTIFICATION RULE:
Before answering, ALWAYS categorize the user query into one of these:
1. Club Members
2. Event Details
3. Registration
4. Vision/Mission
5. General Information
6. Social Links
Then answer ONLY for that category.

🟡 RESPONSIBILITIES:
- accuracy only (use dataset)
- warm tone inspired by UP–Bihar–Jharkhand
- simple creative language
- no guessing anything outside dataset

----- DATASET -----

VISION:
To celebrate, preserve, and promote the rich cultural heritage of Uttar Pradesh, Bihar, and Jharkhand.

MISSION:
To create meaningful cultural experiences, events, and unity among students.

TEAM DETAILS:
President: Tarun Kumar Singh – 23BCE11421
Vice President: Vishal Kumar – 23MIM10133
General Secretary: Vishwas Chouhan – 23BCE10111
Lead Tech: Himalaya Yadav – 23MEI10069
Lead Content: Aditya Singh – 24BSA10344
Co-Lead Content: Rishav Raj – 24BSA10192
Lead Social Media: Aryan Jain – 24BCE11080
Co-Lead Social Media: Amish Chaturvedi – 24BAI10192
Lead Event Management: Devendra Mewada – 23BCE10089
Co-Lead Event Management: Anuradha Kumari – 23BCG10043
Lead Cultural: Syed Haider Abbas – 24BAI10449
Co-Lead Cultural: Avishi Verma – 24BAI10063
Lead: Krish Raj Singh – 24BCE10956
Co-Lead: Ayush – 24MEI10129

PAST EVENT — SANGAM:
Includes: Chhath Puja, Ganga Aarti, Regional Dance & Music, Cultural Parade, Open DJ
Date: 21 Feb 2025
Time: 9 AM – 12:30 AM
Venue: Open Auditorium
Fee: ₹99
------------------------------------------
`;

  const prompt = [
    { role: "system", content: SYSTEM },
    { role: "user", content: userMessage }
  ];

  const result = await model.generateContent({
    contents: prompt
  });

  res.json({ reply: result.response.text() });
}





























// // api/chat.js
// import fetch from "node-fetch";

// /**
//  * Minimal production-ready Vercel serverless endpoint for chat.
//  * - Reads GEMINI_API_KEY from env (never expose to client).
//  * - Calls Gemini REST generateContent endpoint for model gemini-2.5-flash.
//  * - Validates input size.
//  * - Provides structured error handling.
//  *
//  * NOTE: For real production rate limiting, use an external store (Redis / Upstash).
//  */

// // Configuration
// const MAX_USER_MESSAGE_LENGTH = 3000; // limit input to avoid model abuse
// const MODEL = "gemini-2.5-flash";      // model name; verify availability for your key
// const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// const GEMINI_KEY = process.env.GEMINI_API_KEY;
// if (!GEMINI_KEY) {
//   console.error("GEMINI_API_KEY is not set in environment variables.");
// }

// // Optional Upstash-based rate limit (recommended for public sites).
// // If you want to enable, provide UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars.
// // This snippet is illustrative; adapt to your chosen Redis provider.
// async function checkRateLimit(ip) {
//   const url = process.env.UPSTASH_REDIS_REST_URL;
//   const token = process.env.UPSTASH_REDIS_REST_TOKEN;
//   if (!url || !token) {
//     // no remote rate limit; return allowed (but remember: serverless in-memory rate limiting is unreliable)
//     return { allowed: true };
//   }

//   // Token bucket: decrement counter; if absent create with capacity 10 per minute
//   // Use Upstash REST API: POST { "commands": [["GET", key], ["SET", key, "value", "EX", seconds, "NX"]] } etc.
//   // For clarity we'll perform a GET then a SET/DECR flow (simple).
//   const key = `rl:${ip}`;
//   try {
//     // Get
//     const getRes = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     const val = await getRes.json(); // Upstash returns raw JSON
//     let count = Number(val ?? 0);
//     if (isNaN(count)) count = 0;

//     if (count >= 10) {
//       return { allowed: false, retryAfter: 60 };
//     }

//     // Increment (SET with TTL if new)
//     if (count === 0) {
//       // set to 1 with TTL 60 sec
//       await fetch(`${url}/set/${encodeURIComponent(key)}`, {
//         method: "POST",
//         headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//         body: JSON.stringify({ value: "1", ex: 60 }),
//       });
//     } else {
//       // increment
//       await fetch(`${url}/incr/${encodeURIComponent(key)}`, {
//         method: "POST",
//         headers: { Authorization: `Bearer ${token}` },
//       });
//     }

//     return { allowed: true };
//   } catch (err) {
//     console.error("Upstash rate limit check failed:", err);
//     return { allowed: true }; // fail open (safer than failing closed for availability)
//   }
// }

// // Utility: sanitize
// function sanitizeInput(text) {
//   if (typeof text !== "string") return "";
//   return text.trim().slice(0, MAX_USER_MESSAGE_LENGTH);
// }

// export default async function handler(req, res) {
//   try {
//     // Only POST requests
//     if (req.method !== "POST") {
//       res.setHeader("Allow", "POST");
//       return res.status(405).json({ error: "Method not allowed" });
//     }

//     // Basic rate limit per IP (use real Redis in production)
//     const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anon";
//     const rl = await checkRateLimit(ip);
//     if (!rl.allowed) {
//       return res.status(429).json({ error: "Rate limit exceeded", retryAfter: rl.retryAfter });
//     }

//     const { message } = req.body ?? {};
//     if (!message) return res.status(400).json({ error: "Missing `message` in request body." });

//     const userMessage = sanitizeInput(message);
//     if (!userMessage) return res.status(400).json({ error: "Empty message or invalid content." });

//     // Build the Gemini request body (generateContent)
//     const body = {
//       contents: [
//         {
//           role: "system",
//           parts: [{ text: "You are the official AI Agent of Ganga Bhumi Club, VIT Bhopal. Be helpful and concise." }]
//         },
//         {
//           role: "user",
//           parts: [{ text: userMessage }]
//         }
//       ],
//       // Optional: set response modalities, safety_settings, temperature, etc.
//       // e.g., temperature: 0.2, maxOutputTokens: 1024
//     };

//     // Call Gemini generateContent endpoint (REST)
//     const endpoint = `${GEMINI_BASE}/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`;

//     // Retry logic (simple exponential backoff)
//     let attempt = 0, result;
//     const maxAttempts = 2;
//     while (attempt <= maxAttempts) {
//       attempt++;
//       try {
//         const r = await fetch(endpoint, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(body),
//           timeout: 60000,
//         });

//         if (!r.ok) {
//           const errText = await r.text();
//           console.error("Gemini error", r.status, errText);
//           if (r.status >= 500 && attempt <= maxAttempts) {
//             // retry server errors
//             await new Promise((s) => setTimeout(s, 300 * attempt));
//             continue;
//           }
//           return res.status(502).json({ error: "Upstream model error", detail: errText });
//         }

//         result = await r.json();
//         break;
//       } catch (err) {
//         console.error("Fetch to Gemini failed", err);
//         if (attempt <= maxAttempts) {
//           await new Promise((s) => setTimeout(s, 300 * attempt));
//           continue;
//         }
//         return res.status(502).json({ error: "Failed to call model", detail: String(err) });
//       }
//     }

//     // Parse response: the Gemini generateContent response usually places text under candidates[0].content.parts[0].text
//     const candidate = result?.candidates?.[0];
//     const replyText = candidate?.content?.parts?.[0]?.text ?? null;

//     if (!replyText) {
//       console.warn("Model returned unexpected shape:", result);
//       return res.status(502).json({ error: "Invalid response from model", raw: result });
//     }

//     // (OPTIONAL) Persist chat to DB here (MongoDB, Postgres, etc.)

//     return res.status(200).json({ reply: replyText });
//   } catch (err) {
//     console.error("Unexpected server error:", err);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// }
