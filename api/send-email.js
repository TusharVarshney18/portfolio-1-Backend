import nodemailer from 'nodemailer';

export default async function handler(req, res) {
   if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Only POST requests allowed' });
   }

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
         subject: 'New Contact Message',
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
}
