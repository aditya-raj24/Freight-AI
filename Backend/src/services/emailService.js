const nodemailer = require("nodemailer");

let transporter = null;

/**
 * Returns a cached transporter. Creates one dynamically using Ethereal Email if environment variables are not set.
 */
const getTransporter = async () => {
  if (transporter) return transporter;

  const emailUser = process.env.EMAIL_USER;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const refreshToken = process.env.REFRESH_TOKEN;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  const isPlaceholder = (val) => !val || val.includes("ENTER_YOUR_") || val.includes("your_");

  if (emailUser && clientId && clientSecret && refreshToken && !isPlaceholder(emailUser) && !isPlaceholder(clientId)) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: emailUser,
        clientId: clientId,
        clientSecret: clientSecret,
        refreshToken: refreshToken
      }
    });
    console.log("Using Gmail OAuth2 configuration from environment.");
  } else if (smtpHost && smtpUser && smtpPass && !isPlaceholder(smtpUser) && !isPlaceholder(smtpPass)) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    console.log("Using custom SMTP configuration from environment.");
  } else {
    try {
      console.log("\n⚠️  WARNING: SMTP is not configured with actual credentials (found placeholder values in Backend/.env).");
      console.log("👉 Emails will be simulated. Check Ethereal test account links below or the console logs to see sent emails.\n");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`Generated Ethereal test account: ${testAccount.user}`);
    } catch (err) {
      console.error("Failed to generate dynamic Ethereal test account:", err.message);
      transporter = null;
    }
  }
  return transporter;
};

// 📌 Premium HTML Layout for Registration
const getRegistrationHtml = (name, roleName, email, govId) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to FreightLink AI</title>
        <style>
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0f19;
            color: #f3f4f6;
            margin: 0;
            padding: 40px 10px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
            border: 1px solid #374151;
          }
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .header p {
            color: #93c5fd;
            margin: 8px 0 0 0;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .content {
            padding: 40px 30px;
          }
          .welcome-text {
            font-size: 16px;
            color: #e5e7eb;
            margin-bottom: 30px;
            line-height: 1.6;
          }
          .welcome-text strong {
            color: #60a5fa;
          }
          .details-card {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            padding: 24px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            margin-bottom: 35px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 14px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            font-size: 15px;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #9ca3af;
            font-weight: 500;
          }
          .detail-value {
            color: #ffffff;
            font-weight: 600;
          }
          .cta-container {
            text-align: center;
            margin-bottom: 20px;
          }
          .btn {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: #ffffff !important;
            padding: 14px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            display: inline-block;
            box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
            transition: opacity 0.2s;
          }
          .btn:hover {
            opacity: 0.9;
          }
          .footer {
            background-color: #070a13;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #1f2937;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FreightLink AI</h1>
            <p>Railway Logistics Scheduler</p>
          </div>
          <div class="content">
            <div class="welcome-text">
              Hello <strong>${name}</strong>,<br><br>
              Welcome to FreightLink AI! Your account has been registered successfully. You can now log in to manage your freight scheduling, track cargo, and analyze railway logistics.
            </div>
            
            <div class="details-card">
              <div class="detail-row">
                <span class="detail-label">Assigned Role:</span>
                <span class="detail-value" style="color: #60a5fa;">${roleName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Registered Email:</span>
                <span class="detail-value">${email}</span>
              </div>
              ${govId ? `
              <div class="detail-row">
                <span class="detail-label">Officer ID:</span>
                <span class="detail-value" style="color: #34d399;">${govId}</span>
              </div>
              ` : ''}
            </div>

            <div class="cta-container">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="btn">Launch Dashboard</a>
            </div>
          </div>
          <div class="footer">
            &copy; 2026 FreightLink AI Logistics. All rights reserved.<br>
            This is an automated operational notification.
          </div>
        </div>
      </body>
    </html>
  `;
};

// 📌 Premium HTML Layout for Booking Confirmation
const getBookingHtml = (name, booking, formattedArrival) => {
  const statusColor = {
    'Submitted': '#3b82f6',
    'Under Review': '#f59e0b',
    'Approved': '#10b981',
    'Wagon Allocated': '#8b5cf6',
    'Train Scheduled': '#ec4899',
    'In Transit': '#06b6d4',
    'Delivered': '#10b981'
  }[booking.bookingStatus] || '#9ca3af';

  const priorityColor = {
    'Low': '#9ca3af',
    'Medium': '#f59e0b',
    'High': '#ef4444',
    'Critical': '#dc2626'
  }[booking.priority] || '#9ca3af';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Submitted - FreightLink AI</title>
        <style>
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0f19;
            color: #f3f4f6;
            margin: 0;
            padding: 40px 10px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
            border: 1px solid #374151;
          }
          .header {
            background: linear-gradient(135deg, #111827 0%, #1e3a8a 100%);
            padding: 40px 20px;
            text-align: center;
            border-bottom: 2px solid #1d4ed8;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .header p {
            color: #60a5fa;
            margin: 8px 0 0 0;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
          }
          .content {
            padding: 45px 30px;
          }
          .title {
            font-size: 17px;
            color: #e5e7eb;
            margin-bottom: 30px;
            line-height: 1.6;
          }
          .title strong {
            color: #60a5fa;
          }
          .details-card {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            padding: 24px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            margin-bottom: 35px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            font-size: 15px;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #9ca3af;
            font-weight: 500;
          }
          .detail-value {
            color: #ffffff;
            font-weight: 600;
          }
          .badge {
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            color: #ffffff;
            text-transform: uppercase;
          }
          .footer {
            background-color: #070a13;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #1f2937;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Submitted</h1>
            <p>FreightLink AI Confirmation</p>
          </div>
          <div class="content">
            <div class="title">
              Hello <strong>${name}</strong>,<br><br>
              Your wagon booking request has been successfully created. Our Control Room Officers are reviewing your scheduling parameters.
            </div>
            
            <div class="details-card">
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value" style="color: #60a5fa; font-family: monospace; font-size: 16px;">${booking.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Origin Station:</span>
                <span class="detail-value">${booking.sourceStation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Destination Station:</span>
                <span class="detail-value">${booking.destinationStation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Cargo & Weight:</span>
                <span class="detail-value">${booking.cargoType} (${booking.weight} Tons)</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Wagon Count (Est.):</span>
                <span class="detail-value">${booking.wagonCount} Wagon(s)</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Priority:</span>
                <span class="detail-value"><span class="badge" style="background-color: ${priorityColor};">${booking.priority}</span></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value"><span class="badge" style="background-color: ${statusColor};">${booking.bookingStatus}</span></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Est. Delivery:</span>
                <span class="detail-value">${formattedArrival}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            &copy; 2026 FreightLink AI Logistics. All rights reserved.<br>
            This is an academic research application.
          </div>
        </div>
      </body>
    </html>
  `;
};

// 📌 Premium HTML Layout for Booking Status Update
const getStatusUpdateHtml = (name, booking, formattedArrival) => {
  const statusColor = {
    'Submitted': '#3b82f6',
    'Under Review': '#f59e0b',
    'Approved': '#10b981',
    'Wagon Allocated': '#8b5cf6',
    'Train Scheduled': '#ec4899',
    'In Transit': '#06b6d4',
    'Delivered': '#10b981'
  }[booking.bookingStatus] || '#9ca3af';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Status Updated - FreightLink AI</title>
        <style>
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0f19;
            color: #f3f4f6;
            margin: 0;
            padding: 40px 10px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
            border: 1px solid #374151;
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #111827 100%);
            padding: 40px 20px;
            text-align: center;
            border-bottom: 2px solid ${statusColor};
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.5px;
          }
          .header p {
            color: ${statusColor};
            margin: 8px 0 0 0;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            font-weight: 700;
          }
          .content {
            padding: 45px 30px;
          }
          .title {
            font-size: 17px;
            color: #e5e7eb;
            margin-bottom: 30px;
            line-height: 1.6;
          }
          .title strong {
            color: #60a5fa;
          }
          .details-card {
            background: rgba(255, 255, 255, 0.02);
            border-radius: 12px;
            padding: 24px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            margin-bottom: 35px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            font-size: 15px;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            color: #9ca3af;
            font-weight: 500;
          }
          .detail-value {
            color: #ffffff;
            font-weight: 600;
          }
          .badge {
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            color: #ffffff;
            text-transform: uppercase;
          }
          .footer {
            background-color: #070a13;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #1f2937;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Status Update</h1>
            <p>Booking ID: ${booking.bookingId}</p>
          </div>
          <div class="content">
            <div class="title">
              Hello <strong>${name}</strong>,<br><br>
              The status of your FreightLink wagon booking has been updated by the Control Room.
            </div>
            
            <div class="details-card">
              <div class="detail-row">
                <span class="detail-label">Booking ID:</span>
                <span class="detail-value" style="color: #60a5fa; font-family: monospace; font-size: 16px;">${booking.bookingId}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Current Status:</span>
                <span class="detail-value"><span class="badge" style="background-color: ${statusColor};">${booking.bookingStatus}</span></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Origin & Destination:</span>
                <span class="detail-value">${booking.sourceStation} &rarr; ${booking.destinationStation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Wagons Scheduled:</span>
                <span class="detail-value">${booking.wagonCount} Wagon(s)</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Estimated Delivery:</span>
                <span class="detail-value">${formattedArrival}</span>
              </div>
            </div>
          </div>
          <div class="footer">
            &copy; 2026 FreightLink AI Logistics. All rights reserved.<br>
            This is an academic research application.
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Sends a registration confirmation email to the user.
 */
const sendRegistrationEmail = async (email, name, role, govId = null) => {
  const roleName = role === "officer" ? "Control Room Officer" : "Customer / Shipper";
  const subject = "Welcome to FreightLink AI!";
  
  const bodyText = `Hello ${name},

Thank you for registering on FreightLink AI - Academic Railway Logistics Scheduler.

Your account details:
• Role: ${roleName}
• Registered Email: ${email}
${govId ? `• Government Officer ID: ${govId}` : ""}

You can now log in to access your freight logistics dashboard.

Best regards,
FreightLink AI Administration`;

  // 1. Print Simulated Email to Node Console (Always as a fallback)
  console.log("\n============================================================\n" +
              "✉️  SIMULATED OUTGOING EMAIL (REGISTRATION CONFIRMATION)\n" +
              "============================================================\n" +
              `To:      ${email}\n` +
              `Subject: ${subject}\n` +
              "------------------------------------------------------------\n" +
              `${bodyText}\n` +
              "------------------------------------------------------------\n" +
              "============================================================\n");

  // 2. Dispatch actual email via SMTP/Ethereal
  const transporterInstance = await getTransporter();
  if (transporterInstance) {
    try {
      const fromEmail = process.env.EMAIL_USER || process.env.SMTP_USER || transporterInstance.options?.auth?.user || "no-reply@freightlink.ai";
      
      const info = await transporterInstance.sendMail({
        from: `"FreightLink AI" <${fromEmail}>`,
        to: email,
        subject: subject,
        text: bodyText,
        html: getRegistrationHtml(name, roleName, email, govId)
      });
      
      console.log(`Email successfully dispatched via SMTP to ${email}`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`✉️  Ethereal Email Preview URL: ${previewUrl}`);
      }
    } catch (err) {
      console.error(`SMTP delivery failed (falling back to console logging):`, err.message);
    }
  } else {
    console.log("SMTP and Ethereal transport both unavailable. Falling back to console logging.");
  }
};

/**
 * Sends a wagon booking confirmation email to the user.
 */
const sendBookingEmail = async (email, name, booking) => {
  const subject = `FreightLink AI: Booking Confirmation - ${booking.bookingId}`;
  const formattedArrival = booking.estimatedArrival 
    ? new Date(booking.estimatedArrival).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : "TBD";

  const bodyText = `Hello ${name},

Your booking request has been successfully submitted to FreightLink AI.

Booking Details:
• Booking ID: ${booking.bookingId}
• Route: ${booking.sourceStation} ➔ ${booking.destinationStation}
• Cargo: ${booking.cargoType} (${booking.weight} Tons)
• Wagons Allocated: ${booking.wagonCount}
• Priority: ${booking.priority}
• Status: ${booking.bookingStatus}
• Est. Arrival: ${formattedArrival}

You can track your booking status in real-time on your dashboard.

Best regards,
FreightLink AI Administration`;

  // 1. Print Simulated Email to Node Console (Always as a fallback)
  console.log("\n============================================================\n" +
              "✉️  SIMULATED OUTGOING EMAIL (WAGON BOOKING CONFIRMATION)\n" +
              "============================================================\n" +
              `To:      ${email}\n` +
              `Subject: ${subject}\n` +
              "------------------------------------------------------------\n" +
              `${bodyText}\n` +
              "------------------------------------------------------------\n" +
              "============================================================\n");

  // 2. Dispatch actual email via SMTP/Ethereal
  const transporterInstance = await getTransporter();
  if (transporterInstance) {
    try {
      const fromEmail = process.env.EMAIL_USER || process.env.SMTP_USER || transporterInstance.options?.auth?.user || "no-reply@freightlink.ai";
      
      const info = await transporterInstance.sendMail({
        from: `"FreightLink AI" <${fromEmail}>`,
        to: email,
        subject: subject,
        text: bodyText,
        html: getBookingHtml(name, booking, formattedArrival)
      });
      
      console.log(`Email successfully dispatched via SMTP to ${email}`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`✉️  Ethereal Email Preview URL: ${previewUrl}`);
      }
    } catch (err) {
      console.error(`SMTP delivery failed (falling back to console logging):`, err.message);
    }
  } else {
    console.log("SMTP and Ethereal transport both unavailable. Falling back to console logging.");
  }
};

/**
 * Sends an email updating the user on their booking status.
 */
const sendBookingStatusUpdateEmail = async (email, name, booking) => {
  const subject = `FreightLink AI: Booking Status Updated - ${booking.bookingId}`;
  const formattedArrival = booking.estimatedArrival 
    ? new Date(booking.estimatedArrival).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : "TBD";

  const bodyText = `Hello ${name},

The status of your wagon booking (${booking.bookingId}) has been updated.

Booking Status: ${booking.bookingStatus}
Route: ${booking.sourceStation} ➔ ${booking.destinationStation}
Estimated Arrival: ${formattedArrival}

Please log in to your dashboard to review changes.

Best regards,
FreightLink AI Administration`;

  // 1. Print Simulated Email to Node Console (Always as a fallback)
  console.log("\n============================================================\n" +
              "✉️  SIMULATED OUTGOING EMAIL (BOOKING STATUS UPDATE)\n" +
              "============================================================\n" +
              `To:      ${email}\n` +
              `Subject: ${subject}\n` +
              "------------------------------------------------------------\n" +
              `${bodyText}\n` +
              "------------------------------------------------------------\n" +
              "============================================================\n");

  // 2. Dispatch actual email via SMTP/Ethereal
  const transporterInstance = await getTransporter();
  if (transporterInstance) {
    try {
      const fromEmail = process.env.EMAIL_USER || process.env.SMTP_USER || transporterInstance.options?.auth?.user || "no-reply@freightlink.ai";
      
      const info = await transporterInstance.sendMail({
        from: `"FreightLink AI" <${fromEmail}>`,
        to: email,
        subject: subject,
        text: bodyText,
        html: getStatusUpdateHtml(name, booking, formattedArrival)
      });
      
      console.log(`Email successfully dispatched via SMTP to ${email}`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`✉️  Ethereal Email Preview URL: ${previewUrl}`);
      }
    } catch (err) {
      console.error(`SMTP delivery failed (falling back to console logging):`, err.message);
    }
  } else {
    console.log("SMTP and Ethereal transport both unavailable. Falling back to console logging.");
  }
};

const getResetPasswordHtml = (name, otp) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0f19;
            color: #f3f4f6;
            margin: 0;
            padding: 40px 10px;
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4);
            border: 1px solid #374151;
          }
          .header {
            background: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%);
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          .text {
            font-size: 15px;
            color: #e5e7eb;
            line-height: 1.6;
            margin-bottom: 30px;
            text-align: left;
          }
          .otp-card {
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            padding: 24px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            margin: 25px 0;
            display: inline-block;
          }
          .otp-value {
            font-size: 32px;
            font-weight: 800;
            color: #38bdf8;
            letter-spacing: 6px;
            font-family: monospace;
          }
          .footer {
            background-color: #070a13;
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #6b7280;
            border-top: 1px solid #1f2937;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset OTP</h1>
          </div>
          <div class="content">
            <div class="text">
              Hello <strong>${name}</strong>,<br><br>
              A password reset request was received for your FreightLink AI account. Please use the following One-Time Password (OTP) to authorize the change:
            </div>
            
            <div class="otp-card">
              <div class="otp-value">${otp}</div>
            </div>

            <div class="text" style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 20px;">
              This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email and ensure your account password remains secure.
            </div>
          </div>
          <div class="footer">
            &copy; 2026 FreightLink AI Logistics. All rights reserved.
          </div>
        </div>
      </body>
    </html>
  `;
};

const sendResetPasswordEmail = async (email, name, otp) => {
  const subject = "FreightLink AI: Password Reset OTP";
  const bodyText = `Hello ${name},

You requested to reset your password. Here is your 6-digit One-Time Password (OTP) to complete the reset:

OTP Code: ${otp}

This code is valid for 10 minutes. If you did not request this, please ignore this email.

Best regards,
FreightLink AI Administration`;

  console.log("\n============================================================\n" +
              "✉️  SIMULATED OUTGOING EMAIL (PASSWORD RESET OTP)\n" +
              "============================================================\n" +
              `To:      ${email}\n` +
              `Subject: ${subject}\n` +
              "------------------------------------------------------------\n" +
              `${bodyText}\n` +
              "------------------------------------------------------------\n" +
              "============================================================\n");

  const transporterInstance = await getTransporter();
  if (transporterInstance) {
    try {
      const fromEmail = process.env.EMAIL_USER || process.env.SMTP_USER || transporterInstance.options?.auth?.user || "no-reply@freightlink.ai";
      
      const info = await transporterInstance.sendMail({
        from: `"FreightLink AI" <${fromEmail}>`,
        to: email,
        subject: subject,
        text: bodyText,
        html: getResetPasswordHtml(name, otp)
      });
      
      console.log(`Email successfully dispatched via SMTP to ${email}`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`✉️  Ethereal Email Preview URL: ${previewUrl}`);
      }
    } catch (err) {
      console.error(`SMTP delivery failed (falling back to console logging):`, err.message);
    }
  } else {
    console.log("SMTP and Ethereal transport both unavailable. Falling back to console logging.");
  }
};

module.exports = { 
  sendRegistrationEmail, 
  sendBookingEmail,
  sendBookingStatusUpdateEmail,
  sendResetPasswordEmail
};
