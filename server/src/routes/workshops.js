import express from 'express';

export function createWorkshopsRouter(db, socketManager) {
  const router = express.Router();

  // GET /api/workshops - List all workshops with backend-calculated seat stats
  router.get('/', (req, res) => {
    try {
      const workshops = db.getWorkshops();
      res.json({ success: true, workshops });
    } catch (err) {
      console.error('Error fetching workshops:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve workshops from database' });
    }
  });

  // GET /api/workshops/:id - Get specific workshop details
  router.get('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const workshop = db.getWorkshopById(id);

      if (!workshop) {
        return res.status(404).json({ success: false, error: 'Workshop not found' });
      }

      res.json({ success: true, workshop });
    } catch (err) {
      console.error('Error fetching workshop:', err);
      res.status(500).json({ success: false, error: 'Failed to retrieve workshop' });
    }
  });

  // POST /api/workshops - Create a new workshop (Organizer feature)
  router.post('/', (req, res) => {
    try {
      const { title, description, instructor, instructor_role, category, date, time, location, max_seats, tags } = req.body;

      if (!title || !description || !instructor || !date || !time || !location || !max_seats) {
        return res.status(400).json({ success: false, error: 'Missing required workshop fields' });
      }

      const parsedMaxSeats = parseInt(max_seats, 10);
      if (isNaN(parsedMaxSeats) || parsedMaxSeats <= 0) {
        return res.status(400).json({ success: false, error: 'Seat limit must be a positive number' });
      }

      const newWorkshop = db.createWorkshop({
        title: title.trim(),
        description: description.trim(),
        instructor: instructor.trim(),
        instructor_role: instructor_role ? instructor_role.trim() : 'Instructor',
        category: category ? category.trim() : 'General',
        date: date.trim(),
        time: time.trim(),
        location: location.trim(),
        max_seats: parsedMaxSeats,
        tags: Array.isArray(tags) ? tags : ['General']
      });
      
      // Broadcast update
      if (socketManager) {
        socketManager.broadcastSeatUpdate(newWorkshop.id);
        socketManager.broadcastActivity({
          workshopId: newWorkshop.id,
          type: 'WORKSHOP_CREATED',
          message: `✨ New workshop created: "${newWorkshop.title}" (${newWorkshop.max_seats} seats)`,
          timestamp: new Date().toISOString()
        });
      }

      res.status(201).json({
        success: true,
        message: 'Workshop created successfully',
        workshop: newWorkshop
      });
    } catch (err) {
      console.error('Error creating workshop:', err);
      res.status(500).json({ success: false, error: 'Failed to create workshop' });
    }
  });

  return router;
}
