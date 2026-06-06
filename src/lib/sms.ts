export async function sendOtpSms(phoneNumber: string, otp: string) {
  if (!process.env.SEMAPHORE_API_KEY) {
    console.log("SMS OTP DEV MODE:", otp);
    return;
  }

  const message = `Your Barangay Health verification code is ${otp}. It expires in 5 minutes.`;

  const res = await fetch("https://api.semaphore.co/api/v4/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      apikey: process.env.SEMAPHORE_API_KEY,
      number: phoneNumber,
      message,
      sendername: process.env.SEMAPHORE_SENDER_NAME || "SEMAPHORE",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("SEMAPHORE_SMS_ERROR:", text);
    throw new Error("Failed to send SMS OTP.");
  }

  return res.json();
}