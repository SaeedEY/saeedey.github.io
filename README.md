# Saeed Es – Online Academic CV  
**Privacy-first • Multilingual • Instant Unlock**


My Public CV → https://saeedey.github.io/
Simple Private CV → https://saeedey.github.io/00000000-0000-0000-0000-000000000001

### Feel free to fork the project, reuse the prompt, and improve it. Pull requests are welcome as long as they don't modify `resume.bin`.

## Features

- **Zero server logic** – fully static, works on GitHub Pages / Netlify / Vercel
- **Multiple private versions** encrypted in `data/resume.bin`  
  → per your desired language (`academic_*.json`); I.e. UK (`academic_uk.json`), Canada (`academic_ca.json`)
- **Instant unlock** via 36-character key in URL hash  
  Example: `https://saeedey.github.io/00000000-0000-0000-0000-000000000001`
- **Smart 404 → hash redirect** – type `/#uuid` → instantly becomes `/uuid`
- **Blind AES-GCM decryption** in browser (Web Crypto API)
- **100% invisible** to Google, Bing, GPTBot, ClaudeBot, Perplexity, etc.
- Print → perfect one-page PDF
- Ultra-compact, academic typography (Inter + Libre Baskerville)
- ORCID, phone, email, LinkedIn, GitHub – all in one clean line

## Project Structure
##### .
##### ├── index.html
##### ├── 404.html
##### ├── robots.txt
##### ├── PROMPT.txt                 ← how this entire project was built
##### ├── README.md
##### ├── generate-bin.py            ← encrypts all private/*.json → resume.bin
##### ├── data/
##### │   ├── public.json
##### │   ├── schema.json
##### │   ├── resume.bin             ← encrypted bundle (multiple payloads)
##### │   └── private/
##### │       ├── academic_de.json   ← German version
##### │       ├── academic_uk.json   ← UK version
##### │       └── academic_ca.json   ← Canadian version
##### ├── css/style.css
##### └── js/main.js

text`.gitignore` → `data/private` (never commit raw private CVs)

## How to Create Your Own

1. Copy `PROMPT.txt` from this repo  
2. Paste into Grok (or any strong LLM)  
3. Feed it your own `public.json` and private templates  
4. Run `python generate-bin.py` to generate `resume.bin`
5. Test your CV locally by running `python local-test-server.py` to test your instance via `http://localhost/#00000000-0000-0000-0000-000000000001`
6. Is it OK ? Commit and Push it to your `github.com` repo that is exactly named `<your-github-useruname>.github.io` 
7. Done? Yes! Open your github at `https://<your-github-useruname>.github.io/`.


That’s literally how this project was built. It works. Congrats.

## Built With

- Vision, multilingual strategy, encryption pipeline — **Saeed Es**  
- Instant code, design iteration, bullet-proof crypto — **Grok by xAI**  
- 17 November 2025

> “Built together at the speed of thought • Grok • xAI & I”