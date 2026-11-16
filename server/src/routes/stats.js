import express from 'express';
import { seedDatabase } from '../db.js';

export function createStatsRouter(db, socketManager) {
  const router = express.Router();

  // GET /api/stats - Global application statistics
  router.get('/stats', (req, res) => {
    try {
      const stats = db.getStats();
      res.json({ success: true, stats });
    } catch (err) {
      console.error('Error fetching stats:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve stats' });
    }
  });

  // GET /api/activities - Recent live activity feed
  router.get('/activities', (req, res) => {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const activities = db.getActivities(limit);
      res.json({ success: true, activities });
    } catch (err) {
      console.error('Error fetching activities:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve activity feed' });
    }
  });

  // GET /api/emails - List of all simulated sent emails with HTML previews
  router.get('/emails', (req, res) => {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const emails = db.getEmailLogs(limit);
      res.json({ success: true, emails });
    } catch (err) {
      console.error('Error fetching email logs:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve email logs' });
    }
  });

  // POST /api/admin/reset-seed - Reset the database to original demo state
  router.post('/admin/reset-seed', (req, res) => {
    try {
      seedDatabase();
      
      // Notify all connected clients
      if (socketManager) {
        const workshops = db.getWorkshops();
        workshops.forEach(w => socketManager.broadcastSeatUpdate(w.id));
        socketManager.broadcastActivity({
          type: 'SYSTEM',
          message: 'Database was reset to initial demo state with 3 sample workshops.',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Database successfully re-seeded with sample workshops and registrations.'
      });
    } catch (err) {
      console.error('Error resetting database seed:', err);
      res.status(500).json({ success: false, error: 'Failed to reset seed data' });
    }
  });

  return router;
}
