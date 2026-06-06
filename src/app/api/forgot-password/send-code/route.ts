import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transporter } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Email not found." }, { status: 404 });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await transporter.sendMail({
      from: `"Barangay Health Center" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Code",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color:#0EA5E9;">Barangay Health Center Password Reset</h2>
          <p>Your password reset code is:</p>
          <h1 style="letter-spacing: 6px; color:#0EA5E9;">${code}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "Reset code sent successfully.",
      code, // temporary for testing only
    });
  } catch (error) {
    console.error("FORGOT_PASSWORD_SEND_CODE_ERROR", error);

    return NextResponse.json(
      { error: "Unable to send reset code." },
      { status: 500 }
    );
  }
}