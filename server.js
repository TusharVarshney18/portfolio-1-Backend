// server.js
import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/send-email', async (req, res) => {
   const { name, email, message } = req.body;

   try {
      const transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
         },
      });

      await transporter.sendMail({
         from: `"${name}" <${email}>`,
         to: process.env.SMTP_EMAIL,
         subject: "New Contact Message",
         html: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
      });

      res.status(200).json({ message: 'Message sent successfully' });
   } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Something went wrong' });
   }
});

app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});
export default app;