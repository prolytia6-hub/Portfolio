# Ehsan Khalid portfolio

Folder layout:
- `public/` the website (index.html, style.css, script.js)
- `server.js` optional Node backend that emails you the contact form

## How the contact form reaches your inbox

A static page cannot send email by itself, so there are two options. Pick one.

### Option A: no server (easiest, works on Netlify, GitHub Pages, any static host)
1. Go to https://web3forms.com, enter `mehsankhalid02@gmail.com`, and they email you a free access key.
2. In `public/script.js`, set `web3formsKey` to that key. Leave `mode: 'web3forms'`.
3. Upload the `public/` folder. Every enquiry arrives in your Gmail inbox, and Reply goes to the visitor.

Until the key is set, the form falls back to opening the visitor's email app addressed to you.

### Option B: your own backend (Node 20.6+)
1. In Gmail turn on 2-step verification, then create an App Password (Google Account > Security > App passwords).
2. Copy `.env.example` to `.env` and paste the App Password into `SMTP_PASS`.
3. In `public/script.js` set `mode: 'server'`.
4. Run `npm install` then `npm start`, and open http://localhost:3000.
5. Deploy to any Node host (Render, Railway, a VPS). Add the same variables in the host's settings, never commit `.env`.

Includes a hidden honeypot field, input validation and a 5 messages per 10 minutes limit per visitor.

## WhatsApp
Number: +92 324 5270576. Set in `CONFIG.whatsapp` (digits only, `923245270576`) in `public/script.js`.
Uses the free wa.me click-to-chat link: the hero button, the contact row, the floating button and
"Send on WhatsApp" in the form (which pre-fills the visitor's name, service and message) all open a chat with you.
This is a link, not the paid WhatsApp Business Cloud API; that one needs a Meta business account if you later want automatic replies.

## Things to check
- The Toolbox section lists tools tied to your skills. Delete any card for a tool you do not use.
- The experience end date for NewLand Immigration says 24 Aug 2026; update it if that changed.
