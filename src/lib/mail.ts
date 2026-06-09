import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendAnnouncementEmail(
  to: string,
  barangayName: string,
  title: string,
  content: string,
  publishDate: Date,
  imageUrl?: string | null
) {
  const formattedDate = publishDate.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Extract base64 data from data URL so Gmail can render it as a CID attachment
  const attachments: {
    filename: string;
    content: Buffer;
    cid: string;
    contentDisposition: "inline";
  }[] = [];

  let imageHtml = "";

  if (imageUrl) {
    const match = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      const mimeType = match[1];
      const base64Data = match[2];
      const ext = mimeType.split("/")[1];
      attachments.push({
        filename: `announcement.${ext}`,
        content: Buffer.from(base64Data, "base64"),
        cid: "announcementImage",
        contentDisposition: "inline",
      });
      imageHtml = `<img src="cid:announcementImage" alt="Announcement image" style="max-width: 100%; border-radius: 6px; margin: 12px 0;" />`;
    }
  }

  await transporter.sendMail({
    from: `"${barangayName} Health Center" <${process.env.EMAIL_USER}>`,
    to,
    subject: `[Announcement] ${title}`,
    attachments,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <div style="background: #0EA5E9; padding: 16px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0;">📢 ${barangayName} Health Center</h2>
          <p style="color: #e0f2fe; margin: 4px 0 0;">New Announcement</p>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #0EA5E9; margin-top: 0;">${title}</h3>
          <p style="color: #475569; font-size: 13px;">📅 ${formattedDate}</p>
          ${imageHtml}
          <div style="background: #f8fafc; padding: 16px; border-radius: 6px; margin-top: 12px;">
            <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${content}</p>
          </div>
          <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
            This notification was sent by your barangay health center. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendDoctorAvailabilityEmail(
  to: string,
  barangayName: string,
  doctorName: string,
  date: Date,
  startTime: string,
  endTime: string,
  slotMinutes: number
) {
  const formattedDate = date.toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  await transporter.sendMail({
    from: `"${barangayName} Health Center" <${process.env.EMAIL_USER}>`,
    to,
    subject: `[Doctor Available] ${doctorName} on ${formattedDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <div style="background: #0EA5E9; padding: 16px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="color: #ffffff; margin: 0;">🏥 ${barangayName} Health Center</h2>
          <p style="color: #e0f2fe; margin: 4px 0 0;">Doctor Availability Notice</p>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #0EA5E9; margin-top: 0;">Dr. ${doctorName} is now available for appointments</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 8px 12px; background: #f1f5f9; border-radius: 4px; font-weight: 600; width: 140px;">📅 Date</td>
              <td style="padding: 8px 12px;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f1f5f9; border-radius: 4px; font-weight: 600;">🕐 Hours</td>
              <td style="padding: 8px 12px;">${startTime} – ${endTime}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #f1f5f9; border-radius: 4px; font-weight: 600;">⏱ Slot Duration</td>
              <td style="padding: 8px 12px;">${slotMinutes} minutes per slot</td>
            </tr>
          </table>
          <p style="background: #ecfdf5; color: #065f46; padding: 12px 16px; border-radius: 6px;">
            Log in to the Barangay Health Center portal to book your appointment before slots are filled.
          </p>
          <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
            This notification was sent by your barangay health center. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  });
}

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