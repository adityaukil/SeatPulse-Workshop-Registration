import express from 'express';
import crypto from 'crypto';

export function createRegistrationsRouter(db, emailService, socketManager) {
  const router = express.Router();

  // Helper email validator
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // POST /api/workshops/:workshopId/register - Register for a workshop
  router.post('/workshops/:workshopId/register', (req, res) => {
    try {
      const { workshopId } = req.params;
      const { name, email, notes, allowWaitlist = true } = req.body;

      // 1. Validation
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid name (at least 2 characters).'
        });
      }

      if (!email || !isValidEmail(email.trim())) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email address.'
        });
      }

      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      // Fetch workshop from database
      const workshop = db.getWorkshopById(workshopId);
      if (!workshop) {
        return res.status(404).json({
          success: false,
          error: 'Workshop does not exist.'
        });
      }

      // Check for duplicate active registration or waitlist
      const existing = db.findActiveRegistration(workshopId, trimmedEmail);
      if (existing) {
        if (existing.status === 'REGISTERED') {
          return res.status(409).json({
            success: false,
            code: 'DUPLICATE_REGISTRATION',
            error: `You are already registered for "${workshop.title}" with email ${trimmedEmail}.`
          });
        } else {
          return res.status(409).json({
            success: false,
            code: 'DUPLICATE_WAITLIST',
            error: `You are already on the waitlist for "${workshop.title}" with email ${trimmedEmail}.`
          });
        }
      }

      // Check seat limit calculated strictly by backend
      const currentRegistered = workshop.registered_count;
      const maxSeats = Number(workshop.max_seats);
      const cancelToken = crypto.randomUUID();
      const clientBaseUrl = req.headers.origin || 'http://localhost:5173';
      const cancelUrl = `${clientBaseUrl}/cancel?token=${cancelToken}&workshop=${workshop.id}`;

      // Case A: Seats available -> Confirm registration
      if (currentRegistered < maxSeats) {
        const newReg = db.addRegistration({
          workshop_id: workshopId,
          name: trimmedName,
          email: trimmedEmail,
          status: 'REGISTERED',
          cancel_token: cancelToken,
          notes
        });

        // Log activity
        const actMsg = `🎉 ${trimmedName} successfully registered for "${workshop.title}"`;
        db.addActivity({
          workshop_id: workshopId,
          action_type: 'REGISTERED',
          user_name: trimmedName,
          user_email: trimmedEmail,
          message: actMsg
        });

        // Send confirmation email
        emailService.sendRegistrationConfirmation({
          name: trimmedName,
          email: trimmedEmail,
          workshop,
          cancelUrl,
          cancelToken
        });

        const updatedWorkshop = db.getWorkshopById(workshopId);

        // Real-time broadcast
        if (socketManager) {
          socketManager.broadcastSeatUpdate(workshopId);
          socketManager.broadcastActivity({
            workshopId: Number(workshopId),
            type: 'REGISTERED',
            userName: trimmedName,
            message: actMsg,
            timestamp: new Date().toISOString()
          });
        }

        return res.status(201).json({
          success: true,
          status: 'REGISTERED',
          registrationId: newReg.id,
          cancelToken,
          cancelUrl,
          message: `🎉 Registration confirmed! Your seat is secured for "${workshop.title}".`,
          workshop: updatedWorkshop
        });
      }

      // Case B: Workshop is FULL
      if (!allowWaitlist) {
        return res.status(400).json({
          success: false,
          code: 'WORKSHOP_FULL',
          error: `Registration failed: "${workshop.title}" is full (${maxSeats}/${maxSeats} seats filled).`,
          isFull: true
        });
      }

      // Add to Waitlist
      const currentWaitlistCount = workshop.waitlist_count;
      const waitlistPosition = currentWaitlistCount + 1;

      const newWaitlistReg = db.addRegistration({
        workshop_id: workshopId,
        name: trimmedName,
        email: trimmedEmail,
        status: 'WAITLIST',
        cancel_token: cancelToken,
        notes
      });

      // Log activity
      const actMsg = `⏳ ${trimmedName} joined waitlist for "${workshop.title}" (Position #${waitlistPosition})`;
      db.addActivity({
        workshop_id: workshopId,
        action_type: 'WAITLIST_JOINED',
        user_name: trimmedName,
        user_email: trimmedEmail,
        message: actMsg
      });

      // Send waitlist confirmation email
      emailService.sendWaitlistConfirmation({
        name: trimmedName,
        email: trimmedEmail,
        workshop,
        position: waitlistPosition
      });

      const updatedWorkshop = db.getWorkshopById(workshopId);

      // Real-time broadcast
      if (socketManager) {
        socketManager.broadcastSeatUpdate(workshopId);
        socketManager.broadcastActivity({
          workshopId: Number(workshopId),
          type: 'WAITLIST_JOINED',
          userName: trimmedName,
          message: actMsg,
          timestamp: new Date().toISOString()
        });
      }

      return res.status(200).json({
        success: true,
        status: 'WAITLIST',
        position: waitlistPosition,
        registrationId: newWaitlistReg.id,
        cancelToken,
        cancelUrl,
        message: `Workshop is currently full. You have been placed at Position #${waitlistPosition} on the priority waitlist.`,
        workshop: updatedWorkshop
      });

    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({
        success: false,
        error: 'An unexpected server error occurred during registration. Please try again.'
      });
    }
  });

  // POST /api/registrations/cancel - Self-service registration cancellation
  router.post('/registrations/cancel', (req, res) => {
    try {
      const { token, workshopId, email } = req.body;

      if (!token && (!workshopId || !email)) {
        return res.status(400).json({
          success: false,
          error: 'Please provide either a cancellation token or your workshop ID and email.'
        });
      }

      let registration = null;
      if (token) {
        registration = db.findRegistrationByToken(token);
      } else {
        registration = db.findActiveRegistration(workshopId, email);
      }

      if (!registration) {
        return res.status(404).json({
          success: false,
          error: 'No active registration or waitlist entry found matching the provided details.'
        });
      }

      const workshop = db.getWorkshopById(registration.workshop_id);
      const previousStatus = registration.status;

      // Mark as cancelled
      db.cancelRegistration(registration.id);

      // Activity log
      db.addActivity({
        workshop_id: registration.workshop_id,
        action_type: 'CANCELLED',
        user_name: registration.name,
        user_email: registration.email,
        message: `❌ ${registration.name} cancelled registration for "${workshop ? workshop.title : 'Workshop'}"`
      });

      // Send cancellation email
      if (workshop) {
        emailService.sendCancellationConfirmation({
          name: registration.name,
          email: registration.email,
          workshop
        });
      }

      let promotedStudent = null;

      // If the cancelled attendee had a confirmed seat, check for waitlist auto-promotion!
      if (previousStatus === 'REGISTERED' && workshop) {
        const nextPromoted = db.promoteNextInWaitlist(workshop.id);

        if (nextPromoted) {
          promotedStudent = {
            id: nextPromoted.id,
            name: nextPromoted.name,
            email: nextPromoted.email
          };

          // Activity log for auto-promotion
          const promoteAct = `🌟 [AUTO-PROMOTION] ${nextPromoted.name} was promoted from waitlist to confirmed seat for "${workshop.title}"`;
          db.addActivity({
            workshop_id: workshop.id,
            action_type: 'WAITLIST_PROMOTED',
            user_name: nextPromoted.name,
            user_email: nextPromoted.email,
            message: promoteAct
          });

          const clientBaseUrl = req.headers.origin || 'http://localhost:5173';
          const promoCancelUrl = `${clientBaseUrl}/cancel?token=${nextPromoted.cancel_token}&workshop=${workshop.id}`;

          // Send promotion email
          emailService.sendWaitlistPromotion({
            name: nextPromoted.name,
            email: nextPromoted.email,
            workshop,
            cancelUrl: promoCancelUrl,
            cancelToken: nextPromoted.cancel_token
          });
        }
      }

      // Real-time broadcast
      if (socketManager) {
        socketManager.broadcastSeatUpdate(registration.workshop_id);
        socketManager.broadcastActivity({
          workshopId: registration.workshop_id,
          type: 'CANCELLED',
          userName: registration.name,
          message: `${registration.name} cancelled registration. ${promotedStudent ? `🌟 Auto-promoted ${promotedStudent.name} from waitlist!` : 'Seat released.'}`,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: `Registration for "${workshop ? workshop.title : 'Workshop'}" was successfully cancelled.`,
        details: {
          workshopId: registration.workshop_id,
          workshopTitle: workshop ? workshop.title : 'Workshop',
          studentName: registration.name,
          previousStatus,
          promotedStudent
        }
      });

    } catch (err) {
      console.error('Cancellation error:', err);
      res.status(500).json({ success: false, error: 'Failed to cancel registration.' });
    }
  });

  // GET /api/workshops/:workshopId/registrations - Organizer view for a workshop
  router.get('/workshops/:workshopId/registrations', (req, res) => {
    try {
      const { workshopId } = req.params;

      const workshop = db.getWorkshopById(workshopId);
      if (!workshop) {
        return res.status(404).json({ success: false, error: 'Workshop not found' });
      }

      const all = db.getRegistrationsByWorkshop(workshopId);
      const registered = all.filter(r => r.status === 'REGISTERED');
      const waitlist = all.filter(r => r.status === 'WAITLIST');
      const cancelled = all.filter(r => r.status === 'CANCELLED');

      res.json({
        success: true,
        workshop,
        counts: {
          registered: registered.length,
          waitlist: waitlist.length,
          cancelled: cancelled.length,
          total: all.length
        },
        registered,
        waitlist,
        cancelled,
        all
      });
    } catch (err) {
      console.error('Error fetching workshop registrations:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve registrations' });
    }
  });

  // GET /api/registrations/my - Lookup user registrations by email
  router.get('/registrations/my', (req, res) => {
    try {
      const { email } = req.query;
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ success: false, error: 'Valid email parameter is required' });
      }

      const registrations = db.getRegistrationsByEmail(email);

      res.json({
        success: true,
        registrations
      });
    } catch (err) {
      console.error('Error fetching student registrations:', err);
      res.status(500).json({ success: false, error: 'Failed to fetch registrations' });
    }
  });

  // DELETE /api/registrations/:id - Admin cancel/remove attendee
  router.delete('/registrations/:id', (req, res) => {
    try {
      const { id } = req.params;
      const all = db.getState().registrations;
      const reg = all.find(r => r.id === Number(id));
      if (!reg) {
        return res.status(404).json({ success: false, error: 'Registration not found' });
      }

      const workshop = db.getWorkshopById(reg.workshop_id);
      db.cancelRegistration(id);

      let promotedStudent = null;
      if (reg.status === 'REGISTERED' && workshop) {
        const nextPromoted = db.promoteNextInWaitlist(workshop.id);
        if (nextPromoted) {
          promotedStudent = nextPromoted;
          const clientBaseUrl = req.headers.origin || 'http://localhost:5173';
          emailService.sendWaitlistPromotion({
            name: nextPromoted.name,
            email: nextPromoted.email,
            workshop,
            cancelUrl: `${clientBaseUrl}/cancel?token=${nextPromoted.cancel_token}&workshop=${workshop.id}`,
            cancelToken: nextPromoted.cancel_token
          });
        }
      }

      if (socketManager) {
        socketManager.broadcastSeatUpdate(reg.workshop_id);
      }

      res.json({ success: true, message: 'Attendee removed successfully', promotedStudent });
    } catch (err) {
      console.error('Error removing registration:', err);
      res.status(500).json({ success: false, error: 'Failed to remove attendee' });
    }
  });

  return router;
}
