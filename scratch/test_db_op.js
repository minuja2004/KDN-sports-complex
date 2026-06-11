const { Products } = require('../backend/config/db');

async function test() {
  try {
    console.log('--- Testing Product DB Operations ---');
    
    // 1. Create a multiple option product
    const payload = {
      name: 'Test Multiple Option Product',
      description: 'A test product with options',
      price: 15000,
      image: 'test.jpg',
      images: ['test.jpg'],
      category: 'protein',
      stock: 10,
      allowKoko: true,
      isMultipleOption: true,
      optionTitle: 'Select Flavor',
      selectionType: 'radio',
      selections: [
        { id: 'opt-1', name: 'Chocolate', price: 15000, description: 'Choc', image: 'choc.jpg' },
        { id: 'opt-2', name: 'Vanilla', price: 16000, description: 'Van', image: 'van.jpg' }
      ]
    };
    
    const created = await Products.create(payload);
    console.log('Created product ID:', created.id);
    console.log('isMultipleOption:', created.isMultipleOption);
    console.log('selections count:', created.selections?.length);
    
    // 2. Read it back
    const retrieved = await Products.findById(created.id);
    console.log('\nRetrieved product:');
    console.log('isMultipleOption:', retrieved.isMultipleOption);
    console.log('selections:', retrieved.selections);
    
    // 3. Update it
    console.log('\nUpdating product...');
    const updatePayload = {
      name: 'Updated Test Product',
      isMultipleOption: true,
      optionTitle: 'Select Size',
      selectionType: 'dropdown',
      selections: [
        { id: 'opt-1', name: '1kg', price: 15000, description: 'Small', image: 'small.jpg' },
        { id: 'opt-2', name: '2kg', price: 28000, description: 'Big', image: 'big.jpg' }
      ]
    };
    
    const updated = await Products.findByIdAndUpdate(created.id, updatePayload);
    console.log('Updated return value:');
    console.log('isMultipleOption:', updated.isMultipleOption);
    console.log('optionTitle:', updated.optionTitle);
    console.log('selectionType:', updated.selectionType);
    console.log('selections count:', updated.selections?.length);
    
    // 4. Read back updated
    const retrievedUpdated = await Products.findById(created.id);
    console.log('\nRetrieved after update:');
    console.log('isMultipleOption:', retrievedUpdated.isMultipleOption);
    console.log('optionTitle:', retrievedUpdated.optionTitle);
    console.log('selectionType:', retrievedUpdated.selectionType);
    console.log('selections:', retrievedUpdated.selections);
    
    // Cleanup
    await Products.deleteOne({ id: created.id });
    console.log('\nCleanup done. Test complete.');
  } catch (err) {
    console.error('Test failed:', err);
  }
}

test().then(() => process.exit(0));
