const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate unique ticket number
function generateTicketNumber() {
  const prefix = 'TKT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Create a new complaint (User or Deliverer)
const createComplaint = async (req, res) => {
  try {
    const { subject, description, category, orderId, priority } = req.body;
    const userId = req.user.id;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required' });
    }

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    const complaint = await prisma.complaint.create({
      data: {
        ticketNumber: generateTicketNumber(),
        category: category || 'OTHER',
        subject,
        description,
        priority: priority || 'MEDIUM',
        orderId: orderId ? parseInt(orderId) : null,
        userId: userId,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true }
        },
        order: {
          select: { id: true, status: true, orderNumber: true }
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
    const userId = req.user.id;

    const complaints = await prisma.complaint.findMany({
      where: { userId: userId },
      include: {
        responses: {
          include: {
            admin: {
              select: { fullName: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        order: {
          select: { id: true, status: true, orderNumber: true }
        }
      },
      orderBy: { createdAt: 'desc' }
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
    const userId = req.user.id;
    const userRole = req.user.role;

    const complaint = await prisma.complaint.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { id: true, fullName: true, email: true }
        },
        responses: {
          include: {
            admin: {
              select: { fullName: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        order: {
          select: { id: true, status: true, orderNumber: true }
        }
      }
    });

    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Only allow owner or admin to view
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN' && userRole !== 'CUSTOMER_SERVICE' && complaint.userId !== userId) {
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
    const { status, category, priority, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, email: true, role: true }
          },
          responses: {
            include: {
              admin: { select: { fullName: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          order: {
            select: { id: true, status: true, orderNumber: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
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
      rejected: 0,
      escalated: 0,
      closed: 0
    };

    stats.forEach(s => {
      if (s.status === 'PENDING') statsMap.pending = s._count.status;
      if (s.status === 'IN_PROGRESS') statsMap.inProgress = s._count.status;
      if (s.status === 'RESOLVED') statsMap.resolved = s._count.status;
      if (s.status === 'REJECTED') statsMap.rejected = s._count.status;
      if (s.status === 'ESCALATED') statsMap.escalated = s._count.status;
      if (s.status === 'CLOSED') statsMap.closed = s._count.status;
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
    const { status, resolution } = req.body;

    const validStatuses = ['PENDING', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'REJECTED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = { status };
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedAt = new Date();
      if (resolution) updateData.resolution = resolution;
    }

    const complaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: { id: true, fullName: true, email: true }
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
    const { message, isInternal } = req.body;
    const adminId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create response and update status to IN_PROGRESS if PENDING
    const [response, complaint] = await prisma.$transaction([
      prisma.complaintResponse.create({
        data: {
          message,
          isInternal: isInternal || false,
          complaintId: parseInt(id),
          adminId: adminId
        },
        include: {
          admin: {
            select: { fullName: true }
          }
        }
      }),
      prisma.complaint.update({
        where: { id: parseInt(id) },
        data: {
          status: 'IN_PROGRESS'
        },
        include: {
          user: {
            select: { id: true, fullName: true, email: true }
          },
          responses: {
            include: {
              admin: { select: { fullName: true } }
            },
            orderBy: { createdAt: 'asc' }
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
