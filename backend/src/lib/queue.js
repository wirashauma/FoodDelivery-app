const { Queue, Worker } = require('bullmq');
const { redis } = require('./redis');
const { config } = require('./config');

// Connection configuration for BullMQ
const connection = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
};

// ==================== QUEUES ====================

/**
 * Email Queue - For sending emails asynchronously
 */
const emailQueue = new Queue('email', { connection });

/**
 * Notification Queue - For sending push notifications
 */
const notificationQueue = new Queue('notification', { connection });

/**
 * Payment Queue - For payment processing tasks
 */
const paymentQueue = new Queue('payment', { connection });

/**
 * Report Queue - For generating reports (PDF, Excel)
 */
const reportQueue = new Queue('report', { connection });

/**
 * Image Queue - For image processing (compression, resize)
 */
const imageQueue = new Queue('image', { connection });

// ==================== QUEUE HELPERS ====================

/**
 * Add email job to queue
 * @param {Object} emailData - Email data {to, subject, body, template}
 * @returns {Promise<Job>}
 */
async function queueEmail(emailData) {
  return await emailQueue.add('send-email', emailData, {
    attempts: 3, // Retry 3 times if fails
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay
    },
  });
}

/**
 * Add push notification job to queue
 * @param {Object} notificationData - Notification data {userId, title, body, data}
 * @returns {Promise<Job>}
 */
async function queueNotification(notificationData) {
  return await notificationQueue.add('send-notification', notificationData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
}

/**
 * Add payment processing job to queue
 * @param {Object} paymentData - Payment data {orderId, userId, amount}
 * @returns {Promise<Job>}
 */
async function queuePaymentProcessing(paymentData) {
  return await paymentQueue.add('process-payment', paymentData, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
}

/**
 * Add report generation job to queue
 * @param {Object} reportData - Report data {type, userId, dateRange}
 * @returns {Promise<Job>}
 */
async function queueReportGeneration(reportData) {
  return await reportQueue.add('generate-report', reportData, {
    attempts: 2,
    timeout: 60000, // 1 minute timeout
  });
}

/**
 * Add image processing job to queue
 * @param {Object} imageData - Image data {path, operations}
 * @returns {Promise<Job>}
 */
async function queueImageProcessing(imageData) {
  return await imageQueue.add('process-image', imageData, {
    attempts: 3,
  });
}

// ==================== WORKERS ====================

/**
 * Email Worker - Processes email jobs
 */
const emailWorker = new Worker(
  'email',
  async (job) => {
    console.log(`Processing email job ${job.id}:`, job.data);
    
    // TODO: Implement actual email sending
    // Example: Use nodemailer, SendGrid, AWS SES, etc.
    
    // For now, just log
    console.log(`Email sent to ${job.data.to}: ${job.data.subject}`);
    
    return { success: true, sentAt: new Date() };
  },
  { connection }
);

/**
 * Notification Worker - Processes push notification jobs
 */
const notificationWorker = new Worker(
  'notification',
  async (job) => {
    console.log(`Processing notification job ${job.id}:`, job.data);
    
    // TODO: Implement actual FCM push notification
    // Example: Use firebase-admin SDK
    
    console.log(`Notification sent to user ${job.data.userId}: ${job.data.title}`);
    
    return { success: true, sentAt: new Date() };
  },
  { connection }
);

/**
 * Payment Worker - Processes payment jobs
 */
const paymentWorker = new Worker(
  'payment',
  async (job) => {
    console.log(`Processing payment job ${job.id}:`, job.data);
    
    // TODO: Implement payment processing logic
    // Example: Call Midtrans API, update order status, etc.
    
    console.log(`Payment processed for order ${job.data.orderId}`);
    
    return { success: true, processedAt: new Date() };
  },
  { connection }
);

/**
 * Report Worker - Processes report generation jobs
 */
const reportWorker = new Worker(
  'report',
  async (job) => {
    console.log(`Processing report job ${job.id}:`, job.data);
    
    // TODO: Implement report generation
    // Example: Use pdfkit, exceljs, etc.
    
    console.log(`Report generated for user ${job.data.userId}`);
    
    return { success: true, generatedAt: new Date() };
  },
  { connection }
);

/**
 * Image Worker - Processes image optimization jobs
 */
const imageWorker = new Worker(
  'image',
  async (job) => {
    console.log(`Processing image job ${job.id}:`, job.data);
    
    // TODO: Implement image processing
    // Example: Use sharp library for compression/resize
    
    console.log(`Image processed: ${job.data.path}`);
    
    return { success: true, processedAt: new Date() };
  },
  { connection }
);

// ==================== ERROR HANDLERS ====================

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job.id} failed:`, err.message);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`Notification job ${job.id} failed:`, err.message);
});

paymentWorker.on('failed', (job, err) => {
  console.error(`Payment job ${job.id} failed:`, err.message);
});

reportWorker.on('failed', (job, err) => {
  console.error(`Report job ${job.id} failed:`, err.message);
});

imageWorker.on('failed', (job, err) => {
  console.error(`Image job ${job.id} failed:`, err.message);
});

// ==================== SUCCESS HANDLERS ====================

emailWorker.on('completed', (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

notificationWorker.on('completed', (job) => {
  console.log(`✅ Notification job ${job.id} completed`);
});

paymentWorker.on('completed', (job) => {
  console.log(`✅ Payment job ${job.id} completed`);
});

reportWorker.on('completed', (job) => {
  console.log(`✅ Report job ${job.id} completed`);
});

imageWorker.on('completed', (job) => {
  console.log(`✅ Image job ${job.id} completed`);
});

module.exports = {
  // Queues
  emailQueue,
  notificationQueue,
  paymentQueue,
  reportQueue,
  imageQueue,
  
  // Queue helpers
  queueEmail,
  queueNotification,
  queuePaymentProcessing,
  queueReportGeneration,
  queueImageProcessing,
  
  // Workers (export for graceful shutdown)
  workers: {
    emailWorker,
    notificationWorker,
    paymentWorker,
    reportWorker,
    imageWorker,
  },
};
