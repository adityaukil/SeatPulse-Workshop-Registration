import express from 'express';

export function createSettingsRouter(db, emailService) {
  const router = express.Router();

  // GET /api/settings/smtp - Get current SMTP configuration (masking password)
  router.get('/settings/smtp', (req, res) => {
    try {
      const saved = db.getSmtpSettings();
      if (!saved) {
        return res.json({
          success: true,
          configured: false,
          isEthereal: true,
          settings: {
            host: '',
            port: 587,
            user: '',
            pass: '',
            from: '',
            secure: false
          }
        });
      }

      res.json({
        success: true,
        configured: Boolean(saved.host && saved.user),
        isEthereal: false,
        settings: {
          host: saved.host || '',
          port: saved.port || 587,
          user: saved.user || '',
          pass: saved.pass ? '••••••••' : '',
          from: saved.from || '',
          secure: Boolean(saved.secure)
        }
      });
    } catch (err) {
      console.error('Error fetching SMTP settings:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve SMTP settings' });
    }
  });

  // POST /api/settings/smtp - Save custom SMTP credentials
  router.post('/settings/smtp', async (req, res) => {
    try {
      const { host, port, user, pass, from, secure } = req.body;

      if (!host || !user) {
        // Clear to Ethereal
        db.saveSmtpSettings(null);
        await emailService.reconfigureSmtp(null);
        return res.json({
          success: true,
          message: 'Reset to auto-generated Ethereal SMTP test account with live web preview URLs.',
          isEthereal: true
        });
      }

      // If pass is empty or masked and there's an existing pass, preserve it
      const existing = db.getSmtpSettings();
      let finalPass = pass;
      if ((!pass || pass === '••••••••') && existing && existing.pass) {
        finalPass = existing.pass;
      }

      const smtpConfig = {
        host: host.trim(),
        port: port ? parseInt(port, 10) : 587,
        user: user.trim(),
        pass: finalPass,
        from: from ? from.trim() : `"SeatPulse Workshops" <${user.trim()}>`,
        secure: Boolean(secure)
      };

      // Test configuration connection
      const result = await emailService.reconfigureSmtp(smtpConfig);
      db.saveSmtpSettings(smtpConfig);

      res.json({
        success: true,
        message: 'SMTP settings successfully validated and connected!',
        isEthereal: false,
        result
      });
    } catch (err) {
      console.error('SMTP configuration error:', err);
      res.status(400).json({
        success: false,
        error: `SMTP connection verification failed: ${err.message}`
      });
    }
  });

  // POST /api/settings/smtp/test - Send a test email to a real address
  router.post('/settings/smtp/test', async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, error: 'Please enter a valid recipient email address.' });
      }

      const record = await emailService.testSendEmail(email.trim(), name ? name.trim() : 'Valued Attendee');
      res.json({
        success: true,
        message: `Test email dispatched to ${email}.`,
        record
      });
    } catch (err) {
      console.error('Test email error:', err);
      res.status(500).json({ success: false, error: `Failed to dispatch test email: ${err.message}` });
    }
  });

  return router;
}
