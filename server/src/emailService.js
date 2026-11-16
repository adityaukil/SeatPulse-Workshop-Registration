import nodemailer from 'nodemailer';

/**
 * Real Email Dispatcher with Nodemailer + Ethereal / Custom SMTP
 * - Automatically dispatches real emails to target recipient addresses.
 * - If custom SMTP credentials are configured (e.g. Gmail / Brevo / Outlook / SendGrid / custom SMTP), sends straight to real inbox.
 * - If not yet configured, automatically uses an Ethereal SMTP test account with instant live web preview URLs.
 * - Records all dispatched emails in the database with status and preview links.
 */

export function createEmailService(db, io) {
  let transporter = null;
  let isEthereal = false;
  let senderAddress = '"SeatPulse Workshops" <workshops@seatpulse.io>';

  // Initialize Nodemailer transporter
  const initTransporter = async () => {
    try {
      // 1. Check if custom SMTP is saved in db or environment
      const savedSmtp = db.getSmtpSettings ? db.getSmtpSettings() : null;
      const host = savedSmtp?.host || process.env.SMTP_HOST;
      const port = savedSmtp?.port || process.env.SMTP_PORT;
      const user = savedSmtp?.user || process.env.SMTP_USER;
      const pass = savedSmtp?.pass || process.env.SMTP_PASS;
      const secure = savedSmtp?.secure ?? (process.env.SMTP_SECURE === 'true');
      const from = savedSmtp?.from || process.env.SMTP_FROM || senderAddress;

      if (host && user && pass) {
        console.log(`\n📧 Configuring Real SMTP Server: ${host}:${port || 587} (User: ${user})`);
        transporter = nodemailer.createTransport({
          host,
          port: port ? parseInt(port, 10) : 587,
          secure: Boolean(secure),
          auth: { user, pass }
        });
        senderAddress = from;
        isEthereal = false;
        console.log('✅ Real SMTP Email Dispatcher initialized successfully.');
        return;
      }

      // 2. Otherwise initialize Ethereal test account (real SMTP with web preview URLs)
      console.log('\n🔄 Initializing Nodemailer Ethereal SMTP account for instant web-viewable real email delivery...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      senderAddress = `"SeatPulse Workshops" <${testAccount.user}>`;
      isEthereal = true;
      console.log(`✅ Ethereal SMTP ready! (Account: ${testAccount.user})`);
    } catch (err) {
      console.error('⚠️ Could not initialize SMTP transporter:', err);
    }
  };

  initTransporter();

  const sendEmail = async ({ to_email, to_name, subject, preview, content_html, type, workshop_title }) => {
    const timestamp = new Date().toISOString();
    let previewUrl = null;
    let deliveryStatus = 'PENDING';
    let errorMessage = null;

    // Send real email via nodemailer transporter
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: senderAddress,
          to: `"${to_name}" <${to_email}>`,
          subject: subject,
          text: preview,
          html: content_html
        });

        if (isEthereal) {
          previewUrl = nodemailer.getTestMessageUrl(info);
          deliveryStatus = 'DELIVERED_VIA_ETHEREAL';
        } else {
          deliveryStatus = 'DELIVERED_TO_INBOX';
        }

        console.log(`\n================== 📧 REAL EMAIL SENT [${type}] ==================`);
        console.log(`To: ${to_name} <${to_email}>`);
        console.log(`Subject: ${subject}`);
        console.log(`Delivery Status: ${deliveryStatus}`);
        if (previewUrl) {
          console.log(`🔗 Live Web Email URL: ${previewUrl}`);
        }
        console.log(`------------------------------------------------------------------\n`);
      } catch (err) {
        console.error(`❌ Failed to deliver email to ${to_email}:`, err.message);
        deliveryStatus = 'FAILED';
        errorMessage = err.message;
      }
    } else {
      deliveryStatus = 'LOCAL_SIMULATION';
    }

    // Persist in database
    const emailRecord = db.addEmailLog({
      to_email,
      to_name,
      subject,
      preview,
      content_html,
      type,
      workshop_title: workshop_title || '',
      delivery_status: deliveryStatus,
      preview_url: previewUrl,
      error_message: errorMessage
    });

    // Broadcast to WebSocket clients
    if (io && emailRecord) {
      io.emit('email_sent', emailRecord);
    }

    return emailRecord;
  };

  return {
    reconfigureSmtp: async (smtpConfig) => {
      if (!smtpConfig || !smtpConfig.host) {
        await initTransporter();
        return { isEthereal: true };
      }
      transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: parseInt(smtpConfig.port, 10) || 587,
        secure: Boolean(smtpConfig.secure),
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        }
      });
      // Verify connection
      await transporter.verify();
      senderAddress = smtpConfig.from || `"SeatPulse Workshops" <${smtpConfig.user}>`;
      isEthereal = false;
      return { isEthereal: false, host: smtpConfig.host, user: smtpConfig.user };
    },

    testSendEmail: async (toEmail, toName = 'Test User') => {
      return sendEmail({
        to_email: toEmail,
        to_name: toName,
        subject: '🎉 Test Email from SeatPulse Workshop Engine',
        preview: 'This test confirms real email inbox delivery is working smoothly!',
        content_html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #4f46e5;">Email Configuration Verified! 🚀</h2>
            <p>Hi <strong>${toName}</strong>,</p>
            <p>Your SMTP mail configuration is active and working. Real emails for registrations, waitlist updates, and cancellations will be delivered to your inbox.</p>
          </div>
        `,
        type: 'TEST_EMAIL',
        workshop_title: 'System Test'
      });
    },

    sendRegistrationConfirmation: ({ name, email, workshop, cancelUrl, cancelToken }) => {
      const subject = `🎉 Confirmed: You're registered for "${workshop.title}"`;
      const preview = `Your seat is confirmed for ${workshop.date} at ${workshop.time}.`;
      const content_html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 20px; border-radius: 8px; color: white; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 22px;">Seat Confirmed! 🚀</h2>
            <p style="margin: 5px 0 0; opacity: 0.9;">Workshop Registration</p>
          </div>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Great news! Your seat has been successfully reserved for:</p>
          <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 16px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 8px; color: #1e293b;">${workshop.title}</h3>
            <p style="margin: 4px 0; color: #64748b;"><strong>📅 Date:</strong> ${workshop.date} at ${workshop.time}</p>
            <p style="margin: 4px 0; color: #64748b;"><strong>📍 Location:</strong> ${workshop.location}</p>
            <p style="margin: 4px 0; color: #64748b;"><strong>👨‍🏫 Instructor:</strong> ${workshop.instructor} (${workshop.instructor_role || 'Expert'})</p>
          </div>
          
          <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-weight: bold; color: #3730a3;">🎟️ Your Cancellation ID / Token:</p>
            <p style="margin: 0; font-family: monospace; font-size: 14px; background: #ffffff; padding: 8px 12px; border-radius: 4px; border: 1px solid #c7d2fe; color: #1e1b4b; word-break: break-all;">
              ${cancelToken}
            </p>
            <p style="margin: 8px 0 0; font-size: 12px; color: #4338ca;">
              Keep this cancellation ID handy or click the button below if your plans change.
            </p>
          </div>

          <p>If your plans change, please release your seat so someone on the waitlist can take your spot:</p>
          <div style="margin-top: 20px;">
            <a href="${cancelUrl}" style="background: #ef4444; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Cancel My Registration</a>
          </div>
        </div>
      `;
      return sendEmail({
        to_email: email,
        to_name: name,
        subject,
        preview,
        content_html,
        type: 'REGISTRATION_CONFIRMATION',
        workshop_title: workshop.title
      });
    },

    sendWaitlistConfirmation: ({ name, email, workshop, position, cancelUrl, cancelToken }) => {
      const subject = `⏳ Waitlist Confirmation: "${workshop.title}" (Position #${position})`;
      const preview = `You are #${position} on the waitlist. We'll automatically notify and promote you if a seat opens!`;
      const content_html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 20px; border-radius: 8px; color: white; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 22px;">You're on the Waitlist! ⏳</h2>
            <p style="margin: 5px 0 0; opacity: 0.9;">Priority Queue Position #${position}</p>
          </div>
          <p>Hi <strong>${name}</strong>,</p>
          <p>The workshop <strong>"${workshop.title}"</strong> is currently at full capacity (<strong>${workshop.max_seats} seats filled</strong>).</p>
          <p>You have been placed at <strong>Position #${position}</strong> on the priority waitlist. If an attendee cancels their seat, our automated queue system will immediately promote you and deliver a confirmed seat pass!</p>
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>Workshop Date:</strong> ${workshop.date} at ${workshop.time}</p>
            <p style="margin: 4px 0 0; color: #92400e;"><strong>Location:</strong> ${workshop.location}</p>
          </div>
          ${cancelToken ? `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; margin-top: 16px;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">Cancellation ID / Token: <code>${cancelToken}</code></p>
          </div>
          ` : ''}
        </div>
      `;
      return sendEmail({
        to_email: email,
        to_name: name,
        subject,
        preview,
        content_html,
        type: 'WAITLIST_CONFIRMATION',
        workshop_title: workshop.title
      });
    },

    sendWaitlistPromotion: ({ name, email, workshop, cancelUrl, cancelToken }) => {
      const subject = `🌟 Exciting News! You've been promoted off the waitlist for "${workshop.title}"`;
      const preview = `A seat opened up and has been automatically assigned to you!`;
      const content_html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 20px; border-radius: 8px; color: white; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 22px;">Seat Awarded! 🌟</h2>
            <p style="margin: 5px 0 0; opacity: 0.9;">Auto-Promoted from Waitlist</p>
          </div>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Great news! Another student cancelled their registration, and you were next in line on the waitlist. <strong>Your seat is now confirmed!</strong></p>
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
            <h3 style="margin: 0 0 8px; color: #065f46;">${workshop.title}</h3>
            <p style="margin: 4px 0; color: #047857;"><strong>📅 Date:</strong> ${workshop.date} at ${workshop.time}</p>
            <p style="margin: 4px 0; color: #047857;"><strong>📍 Location:</strong> ${workshop.location}</p>
          </div>

          <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-weight: bold; color: #3730a3;">🎟️ Your Cancellation ID / Token:</p>
            <p style="margin: 0; font-family: monospace; font-size: 14px; background: #ffffff; padding: 8px 12px; border-radius: 4px; border: 1px solid #c7d2fe; color: #1e1b4b; word-break: break-all;">
              ${cancelToken}
            </p>
          </div>

          <div style="margin-top: 20px;">
            <a href="${cancelUrl}" style="background: #ef4444; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">Cancel If Unable to Attend</a>
          </div>
        </div>
      `;
      return sendEmail({
        to_email: email,
        to_name: name,
        subject,
        preview,
        content_html,
        type: 'WAITLIST_PROMOTED',
        workshop_title: workshop.title
      });
    },

    sendCancellationConfirmation: ({ name, email, workshop }) => {
      const subject = `ℹ️ Registration Cancelled: "${workshop.title}"`;
      const preview = `Your registration has been cancelled and your seat has been released.`;
      const content_html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="background: #64748b; padding: 20px; border-radius: 8px; color: white; margin-bottom: 20px;">
            <h2 style="margin: 0; font-size: 22px;">Registration Cancelled</h2>
            <p style="margin: 5px 0 0; opacity: 0.9;">Workshop: ${workshop.title}</p>
          </div>
          <p>Hi <strong>${name}</strong>,</p>
          <p>This is to confirm that your registration for <strong>"${workshop.title}"</strong> has been successfully cancelled.</p>
          <p>Your seat has been released to the next person waiting on the queue. Thank you for notifying us!</p>
        </div>
      `;
      return sendEmail({
        to_email: email,
        to_name: name,
        subject,
        preview,
        content_html,
        type: 'CANCELLATION_CONFIRMATION',
        workshop_title: workshop.title
      });
    }
  };
}
