import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendOtpEmail(to: string, otp: string) {
  await transporter.sendMail({
    from: `"Barangay Health Center" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your Barangay Health Registration Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #0f172a;">
        <h2 style="color: #2563EB;">Barangay Health Center Registration</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 16px 0; color: #2563EB;">
          ${otp}
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you did not request this, you may ignore this email.</p>
      </div>
    `,
  });
}