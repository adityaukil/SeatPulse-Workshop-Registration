export function setupSocket(io, db) {
  io.on('connection', (socket) => {
    console.log(`⚡ WebSocket client connected: ${socket.id}`);

    // Send current live workshop states to newly connected client
    const workshops = db.getWorkshops();
    socket.emit('initial_state', { workshops });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return {
    broadcastSeatUpdate: (workshopId) => {
      const updated = db.getWorkshopById(workshopId);
      if (updated) {
        io.emit('seat_update', {
          workshopId: Number(workshopId),
          workshop: updated,
          registeredCount: updated.registered_count,
          waitlistCount: updated.waitlist_count,
          seatsLeft: updated.seats_left,
          isFull: updated.is_full
        });
      }
    },

    broadcastActivity: (activity) => {
      io.emit('activity_event', activity);
    }
  };
}
