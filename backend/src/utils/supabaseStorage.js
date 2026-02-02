// ============================================
// Supabase Storage Utility
// ============================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

const getSupabaseClient = () => {
  if (!supabase && supabaseUrl && supabaseServiceKey) {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabase;
};

// Storage bucket names
const BUCKETS = {
  DOCUMENTS: 'documents',
  PRODUCTS: 'products',
  RESTAURANTS: 'restaurants',
  PROFILES: 'profiles'
};

/**
 * Upload file to Supabase Storage
 * @param {Buffer|string} fileData - File buffer or file path
 * @param {string} bucket - Bucket name
 * @param {string} fileName - Desired file name in storage
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<{url: string, path: string}>}
 */
const uploadFile = async (fileData, bucket, fileName, contentType = 'image/jpeg') => {
  const client = getSupabaseClient();
  
  if (!client) {
    console.warn('Supabase client not initialized. Using local storage fallback.');
    return uploadFileLocal(fileData, bucket, fileName);
  }

  try {
    let buffer;
    if (typeof fileData === 'string') {
      // It's a file path
      buffer = fs.readFileSync(fileData);
    } else {
      buffer = fileData;
    }

    // Generate unique file name
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}_${fileName}`;
    const filePath = `${bucket}/${uniqueFileName}`;

    // Upload to Supabase
    const { data, error } = await client.storage
      .from(bucket)
      .upload(uniqueFileName, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Supabase upload error:', error);
      // Fallback to local storage
      return uploadFileLocal(fileData, bucket, fileName);
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(uniqueFileName);

    return {
      url: urlData.publicUrl,
      path: data.path,
      bucket: bucket
    };
  } catch (error) {
    console.error('Upload error:', error);
    // Fallback to local storage
    return uploadFileLocal(fileData, bucket, fileName);
  }
};

/**
 * Upload file to local storage (fallback)
 */
const uploadFileLocal = async (fileData, bucket, fileName) => {
  const uploadsDir = path.join(__dirname, '../../uploads', bucket);
  
  // Ensure directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}_${fileName}`;
  const filePath = path.join(uploadsDir, uniqueFileName);

  let buffer;
  if (typeof fileData === 'string') {
    buffer = fs.readFileSync(fileData);
  } else {
    buffer = fileData;
  }

  fs.writeFileSync(filePath, buffer);

  return {
    url: `/uploads/${bucket}/${uniqueFileName}`,
    path: `${bucket}/${uniqueFileName}`,
    bucket: bucket,
    isLocal: true
  };
};

/**
 * Upload document (KTP, SIM, NPWP, Face)
 * @param {Object} file - Multer file object
 * @param {string} documentType - Type of document (ktp, sim, npwp, face)
 * @param {number} userId - User ID for organizing files
 */
const uploadDocument = async (file, documentType, userId) => {
  const extension = path.extname(file.originalname) || '.jpg';
  const fileName = `${documentType}_${userId}${extension}`;
  const contentType = file.mimetype || 'image/jpeg';

  return uploadFile(file.buffer || file.path, BUCKETS.DOCUMENTS, fileName, contentType);
};

/**
 * Upload product image
 * @param {Object} file - Multer file object
 * @param {number} productId - Product ID
 */
const uploadProductImage = async (file, productId) => {
  const extension = path.extname(file.originalname) || '.jpg';
  const fileName = `product_${productId || 'new'}${extension}`;
  const contentType = file.mimetype || 'image/jpeg';

  return uploadFile(file.buffer || file.path, BUCKETS.PRODUCTS, fileName, contentType);
};

/**
 * Upload restaurant image
 * @param {Object} file - Multer file object
 * @param {number} restaurantId - Restaurant ID
 */
const uploadRestaurantImage = async (file, restaurantId) => {
  const extension = path.extname(file.originalname) || '.jpg';
  const fileName = `restaurant_${restaurantId || 'new'}${extension}`;
  const contentType = file.mimetype || 'image/jpeg';

  return uploadFile(file.buffer || file.path, BUCKETS.RESTAURANTS, fileName, contentType);
};

/**
 * Upload profile picture
 * @param {Object} file - Multer file object
 * @param {number} userId - User ID
 */
const uploadProfilePicture = async (file, userId) => {
  const extension = path.extname(file.originalname) || '.jpg';
  const fileName = `profile_${userId}${extension}`;
  const contentType = file.mimetype || 'image/jpeg';

  return uploadFile(file.buffer || file.path, BUCKETS.PROFILES, fileName, contentType);
};

/**
 * Delete file from Supabase Storage
 * @param {string} bucket - Bucket name
 * @param {string} filePath - File path in bucket
 */
const deleteFile = async (bucket, filePath) => {
  const client = getSupabaseClient();
  
  if (!client) {
    console.warn('Supabase client not initialized.');
    return { success: false };
  }

  try {
    const { error } = await client.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error };
  }
};

/**
 * Get public URL for a file
 * @param {string} bucket - Bucket name
 * @param {string} filePath - File path in bucket
 */
const getPublicUrl = (bucket, filePath) => {
  const client = getSupabaseClient();
  
  if (!client) {
    // Return local URL
    return `/uploads/${bucket}/${filePath}`;
  }

  const { data } = client.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

module.exports = {
  uploadFile,
  uploadDocument,
  uploadProductImage,
  uploadRestaurantImage,
  uploadProfilePicture,
  deleteFile,
  getPublicUrl,
  BUCKETS,
  getSupabaseClient
};
