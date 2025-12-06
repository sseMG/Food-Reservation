/**
 * Repository Factory
 * Auto-detects database connection and returns appropriate repository implementation
 */
const mongoose = require('mongoose');

/**
 * Check if MongoDB is connected
 */
function usingMongo() {
  return !!(mongoose && mongoose.connection && mongoose.connection.readyState === 1);
}

// Cache repository instances (singleton pattern)
const repositoryCache = {};

class RepositoryFactory {
  /**
   * Get User Repository
   */
  static getUserRepository() {
    const key = 'user';
    if (repositoryCache[key]) return repositoryCache[key];
    
    if (usingMongo()) {
      repositoryCache[key] = require('./mongodb/user.repository');
    } else {
      repositoryCache[key] = require('./json/user.repository');
    }
    return repositoryCache[key];
  }

  /**
   * Get Menu Repository
   */
  static getMenuRepository() {
    const key = 'menu';
    if (repositoryCache[key]) return repositoryCache[key];
    
    if (usingMongo()) {
      repositoryCache[key] = require('./mongodb/menu.repository');
    } else {
      repositoryCache[key] = require('./json/menu.repository');
    }
    return repositoryCache[key];
  }

  /**
   * Get Category Repository
   */
  static getCategoryRepository() {
    const key = 'categories';
    if (repositoryCache[key]) return repositoryCache[key];
    
    if (usingMongo()) {
      repositoryCache[key] = require('./mongodb/category.repository');
    } else {
      repositoryCache[key] = require('./json/category.repository');
    }
    return repositoryCache[key];
  }

  /**
   * Get Reservation Repository
   */
  static getReservationRepository() {
    const key = 'reservation';
    if (repositoryCache[key]) return repositoryCache[key];
    
    if (usingMongo()) {
      repositoryCache[key] = require('./mongodb/reservation.repository');
    } else {
      repositoryCache[key] = require('./json/reservation.repository');
    }
    return repositoryCache[key];
  }

  /**
   * Get Topup Repository
   */
  static getTopupRepository() {
    const key = 'topup';
    if (repositoryCache[key]) return repositoryCache[key];
    
    if (usingMongo()) {
      repositoryCache[key] = require('./mongodb/topup.repository');
    } else {
      repositoryCache[key] = require('./json/topup.repository');
    }
    return repositoryCache[key];
  }

  /**
   * Get Transaction Repository
   */
  static getTransactionRepository() {
    const key = 'transaction';
    if (repositoryCache[key]) return repositoryCache[key];
    
    if (usingMongo()) {
      repositoryCache[key] = require('./mongodb/transaction.repository');
    } else {
      repositoryCache[key] = require('./json/transaction.repository');
    }
    return repositoryCache[key];
  }

  /**
   * Get Notification Repository
   */
  static getNotificationRepository() {
    const key = 'notification';
    if (repositoryCache[key]) return repositoryCache[key];
    
    if (usingMongo()) {
      repositoryCache[key] = require('./mongodb/notification.repository');
    } else {
      repositoryCache[key] = require('./json/notification.repository');
    }
    return repositoryCache[key];
  }

  /**
   * Get Wallet Repository
   */
  static getWalletRepository() {
    const key = 'wallet';
    if (repositoryCache[key]) return repositoryCache[key];
    
    if (usingMongo()) {
      repositoryCache[key] = require('./mongodb/wallet.repository');
    } else {
      repositoryCache[key] = require('./json/wallet.repository');
    }
    return repositoryCache[key];
  }

  /**
   * Get Cart Repository
   */
  static getCartRepository() {
    const key = 'cart';
    if (repositoryCache[key]) return repositoryCache[key];
    
    if (usingMongo()) {
      repositoryCache[key] = require('./mongodb/cart.repository');
    } else {
      repositoryCache[key] = require('./json/cart.repository');
    }
    return repositoryCache[key];
  }

  /**
   * Clear repository cache (useful for testing)
   */
  static clearCache() {
    Object.keys(repositoryCache).forEach(key => delete repositoryCache[key]);
  }

  /**
   * Get current database type
   */
  static getDatabaseType() {
    return usingMongo() ? 'mongodb' : 'json';
  }
}

module.exports = RepositoryFactory;

