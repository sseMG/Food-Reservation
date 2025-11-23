/**
 * Data normalization utilities
 * Handles conversion between JSON and MongoDB data formats
 */

/**
 * Normalize MongoDB document to standard format
 * Converts _id to id and ensures consistent data shape
 */
function normalizeMongoDoc(doc) {
  if (!doc) return null;
  
  const normalized = { ...doc };
  
  // Convert _id to id if _id exists
  if (normalized._id) {
    normalized.id = normalized.id || normalized._id.toString();
    // Keep _id for MongoDB operations but prefer id for API responses
  }
  
  return normalized;
}

/**
 * Normalize array of MongoDB documents
 */
function normalizeMongoDocs(docs) {
  if (!Array.isArray(docs)) return [];
  return docs.map(normalizeMongoDoc).filter(Boolean);
}

/**
 * Normalize ID for queries (accepts both id and _id)
 */
function normalizeId(id) {
  if (!id) return null;
  return String(id);
}

/**
 * Create MongoDB query filter that handles both id and _id
 */
function createIdFilter(id) {
  const { ObjectId } = require('mongodb');
  const filters = [{ id: String(id) }];
  
  if (ObjectId.isValid(id)) {
    filters.push({ _id: new ObjectId(id) });
  }
  
  return filters.length > 1 ? { $or: filters } : filters[0];
}

/**
 * Ensure document has required fields with defaults
 */
function ensureDefaults(doc, defaults = {}) {
  const result = { ...defaults, ...doc };
  
  // Ensure timestamps
  if (!result.createdAt) {
    result.createdAt = new Date().toISOString();
  }
  if (!result.updatedAt) {
    result.updatedAt = new Date().toISOString();
  }
  
  return result;
}

/**
 * Remove MongoDB-specific fields before returning to API
 */
function sanitizeForResponse(doc) {
  if (!doc) return null;
  
  const sanitized = { ...doc };
  
  // Remove _id if id exists (prefer id)
  if (sanitized.id && sanitized._id) {
    delete sanitized._id;
  }
  
  // Remove MongoDB internal fields
  delete sanitized.__v;
  
  return sanitized;
}

module.exports = {
  normalizeMongoDoc,
  normalizeMongoDocs,
  normalizeId,
  createIdFilter,
  ensureDefaults,
  sanitizeForResponse,
};

