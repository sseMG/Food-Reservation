// Script to update existing menu items with default availability fields
require('dotenv').config();

const RepositoryFactory = require('./src/repositories/repository.factory');

async function updateExistingItems() {
  try {
    console.log('🔄 Updating existing menu items with availability fields...');
    
    const menuRepo = RepositoryFactory.getMenuRepository();
    const items = await menuRepo.findAll();
    
    console.log(`📋 Found ${items.length} items to check`);
    
    let updatedCount = 0;
    
    for (const item of items) {
      const needsUpdate = !item.availableDays || !item.availableSlots;
      
      if (needsUpdate) {
        const updateData = {
          ...item,
          availableDays: item.availableDays || [], // Default to empty array (all days)
          availableSlots: item.availableSlots || [], // Default to empty array (all windows)
        };
        
        const updated = await menuRepo.update(item.id, updateData);
        if (updated) {
          console.log(`✅ Updated item: ${item.name} (${item.id})`);
          updatedCount++;
        } else {
          console.log(`❌ Failed to update item: ${item.name} (${item.id})`);
        }
      } else {
        console.log(`⏭️  Item already has availability fields: ${item.name} (${item.id})`);
      }
    }
    
    console.log(`\n🎉 Update complete! ${updatedCount} items updated out of ${items.length} total items`);
    
  } catch (error) {
    console.error('❌ Error updating items:', error);
    process.exit(1);
  }
}

// Run the update
updateExistingItems().then(() => {
  console.log('✅ Script completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
