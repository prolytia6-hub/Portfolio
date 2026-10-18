// Contact backend: receives the portfolio form and emails it to your inbox.
// Run:  npm install && npm start   (copy .env.example to .env first)
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const MAIL_TO = process.env.MAIL_TO || 'mehsankhalid02@gmail.com';
const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || 'gmail',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// very small in-memory rate limit: 5 messages per 10 minutes per IP
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}

const clean = (s, max) => String(s || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

app.post('/api/contact', async (req, res) => {
  const b = req.body || {};
  if (b.website) return res.json({ ok: true }); // honeypot
  if (limited(req.ip)) return res.status(429).json({ ok: false, error: 'Too many messages, try later.' });

  const name = clean(b.name, 80);
  const email = clean(b.email, 120);
  const phone = clean(b.phone, 30);
  const service = clean(b.service, 60);
  const message = String(b.message || '').trim().slice(0, 2000);

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 5) {
    return res.status(400).json({ ok: false, error: 'Please complete the form.' });
  }

  try {
    await transporter.sendMail({
      from: `"Portfolio" <${process.env.SMTP_USER}>`,
      to: MAIL_TO,
      replyTo: `"${name.replace(/"/g, '')}" <${email}>`, // hitting Reply answers the visitor
      subject: `Portfolio enquiry: ${service || 'General'} from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || '-'}\nService: ${service}\n\n${message}`,
      html: `<h3>New portfolio enquiry</h3>
        <p><b>Name:</b> ${esc(name)}<br><b>Email:</b> ${esc(email)}<br><b>Phone:</b> ${esc(phone || '-')}<br><b>Service:</b> ${esc(service)}</p>
        <p>${esc(message).replace(/\n/g, '<br>')}</p>`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Mail error:', err.message);
    res.status(500).json({ ok: false, error: 'Could not send email.' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Portfolio running on http://localhost:${port}`));
