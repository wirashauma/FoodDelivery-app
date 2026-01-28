const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new complaint (User or Deliverer)
const createComplaint = async (req, res) => {
  try {
    const { subject, message, orderId, priority } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' });
    }

    // Determine complaint type based on user role
    const type = userRole === 'DELIVERER' ? 'DELIVERER' : 'USER';

    const complaint = await prisma.complaint.create({
      data: {
        type,
        subject,
        message,
        priority: priority || 'MEDIUM',
        order_id: orderId || null,
        reporter_id: userId,
      },
      include: {
        reporter: {
          select: { user_id: true, nama: true, email: true }
        },
        order: {
          select: { id: true, status: true }
        }
      }
    });

    res.status(201).json({
      message: 'Complaint submitted successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: 'Failed to create complaint' });
  }
};

// Get user's own complaints
const getMyComplaints = async (req, res) => {
  try {
    const userId = req.user.userId;

    const complaints = await prisma.complaint.findMany({
      where: { reporter_id: userId },
      include: {
        responses: {
          include: {
            admin: {
              select: { nama: true }
            }
          },
          orderBy: { created_at: 'asc' }
        },
        order: {
          select: { id: true, status: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({ data: complaints });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

// Get single complaint detail
const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
      include: {
        reporter: {
          select: { user_id: true, nama: true, email: true }
        },
        responses: {
          include: {
            admin: {
              select: { nama: true }
            }
          },
          orderBy: { created_at: 'asc' }
        },
        order: {
          select: { id: true, status: true, item_id: true }
        }
      }
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Only allow owner or admin to view
    if (userRole !== 'ADMIN' && complaint.reporter_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ data: complaint });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({ error: 'Failed to fetch complaint' });
  }
};

// ============ ADMIN FUNCTIONS ============

// Get all complaints (Admin)
const getAllComplaints = async (req, res) => {
  try {
    const { status, type, priority, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          reporter: {
            select: { user_id: true, nama: true, email: true, role: true }
          },
          responses: {
            include: {
              admin: { select: { nama: true } }
            },
            orderBy: { created_at: 'desc' },
            take: 1
          },
          order: {
            select: { id: true, status: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { created_at: 'desc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.complaint.count({ where })
    ]);

    // Get stats
    const stats = await prisma.complaint.groupBy({
      by: ['status'],
      _count: { status: true }
    });

    const statsMap = {
      total,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0
    };

    stats.forEach(s => {
      if (s.status === 'PENDING') statsMap.pending = s._count.status;
      if (s.status === 'IN_PROGRESS') statsMap.inProgress = s._count.status;
      if (s.status === 'RESOLVED') statsMap.resolved = s._count.status;
      if (s.status === 'REJECTED') statsMap.rejected = s._count.status;
    });

    res.json({
      data: complaints,
      stats: statsMap,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all complaints:', error);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
};

// Update complaint status (Admin)
const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const complaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        reporter: {
          select: { user_id: true, nama: true, email: true }
        },
        responses: true
      }
    });

    res.json({
      message: 'Complaint status updated',
      data: complaint
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
};

// Add response to complaint (Admin)
const addResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const adminId = req.user.userId;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create response and update status to IN_PROGRESS if PENDING
    const [response, complaint] = await prisma.$transaction([
      prisma.complaintResponse.create({
        data: {
          message,
          complaint_id: parseInt(id),
          admin_id: adminId
        },
        include: {
          admin: {
            select: { nama: true }
          }
        }
      }),
      prisma.complaint.update({
        where: { id: parseInt(id) },
        data: {
          status: 'IN_PROGRESS'
        },
        include: {
          reporter: {
            select: { user_id: true, nama: true, email: true }
          },
          responses: {
            include: {
              admin: { select: { nama: true } }
            },
            orderBy: { created_at: 'asc' }
          }
        }
      })
    ]);

    res.status(201).json({
      message: 'Response added successfully',
      data: complaint
    });
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ error: 'Failed to add response' });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateComplaintStatus,
  addResponse
};
