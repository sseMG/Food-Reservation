/**
 * Base Repository Interface
 * Abstract base class for all repository implementations
 */
class BaseRepository {
  /**
   * Find a document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>} Document or null if not found
   */
  async findById(id) {
    throw new Error('findById must be implemented by subclass');
  }

  /**
   * Find all documents matching query
   * @param {Object} query - Query object
   * @returns {Promise<Array>} Array of documents
   */
  async findAll(query = {}) {
    throw new Error('findAll must be implemented by subclass');
  }

  /**
   * Find one document matching query
   * @param {Object} query - Query object
   * @returns {Promise<Object|null>} Document or null if not found
   */
  async findOne(query = {}) {
    throw new Error('findOne must be implemented by subclass');
  }

  /**
   * Create a new document
   * @param {Object} data - Document data
   * @returns {Promise<Object>} Created document
   */
  async create(data) {
    throw new Error('create must be implemented by subclass');
  }

  /**
   * Update a document by ID
   * @param {string} id - Document ID
   * @param {Object} data - Update data
   * @returns {Promise<Object|null>} Updated document or null if not found
   */
  async update(id, data) {
    throw new Error('update must be implemented by subclass');
  }

  /**
   * Delete a document by ID
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    throw new Error('delete must be implemented by subclass');
  }

  /**
   * Count documents matching query
   * @param {Object} query - Query object
   * @returns {Promise<number>} Count of documents
   */
  async count(query = {}) {
    throw new Error('count must be implemented by subclass');
  }

  /**
   * Check if document exists
   * @param {string} id - Document ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id) {
    const doc = await this.findById(id);
    return doc !== null;
  }

  /**
   * Normalize ID for consistent handling
   * @param {string} id - Document ID
   * @returns {string} Normalized ID
   */
  normalizeId(id) {
    return String(id || '').trim();
  }
}

module.exports = BaseRepository;

