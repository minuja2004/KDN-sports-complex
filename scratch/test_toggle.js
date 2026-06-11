const { Products } = require('../backend/config/db');

async function testToggle() {
  try {
    console.log('--- Testing Product Type Toggle Operations ---');
    
    // 1. Create a single product
    const payload = {
      name: 'Test Toggle Product',
      description: 'A test product for toggling',
      price: 10000,
      image: 'single.jpg',
      images: ['single.jpg'],
      category: 'creatine',
      stock: 5,
      allowKoko: false,
      isMultipleOption: false,
      optionTitle: '',
      selectionType: 'dropdown',
      selections: []
    };
    
    const created = await Products.create(payload);
    console.log('Created as single. ID:', created.id);
    console.log('isMultipleOption:', created.isMultipleOption);
    
    // 2. Toggle to multiple options
    console.log('\nToggling to multiple options...');
    const updateToMult = {
      isMultipleOption: true,
      optionTitle: 'Flavors',
      selectionType: 'radio',
      selections: [
        { id: 'opt-1', name: 'Strawberry', price: 11000, description: 'Berry', image: 'straw.jpg' }
      ]
    };
    const updatedToMult = await Products.findByIdAndUpdate(created.id, updateToMult);
    console.log('Updated to mult return value:');
    console.log('isMultipleOption:', updatedToMult.isMultipleOption);
    console.log('selections count:', updatedToMult.selections?.length);
    
    const retrievedMult = await Products.findById(created.id);
    console.log('Retrieved mult from DB:');
    console.log('isMultipleOption:', retrievedMult.isMultipleOption);
    console.log('selections:', retrievedMult.selections);
    
    // 3. Toggle back to single
    console.log('\nToggling back to single...');
    const updateToSingle = {
      isMultipleOption: false,
      price: 12000,
      selections: []
    };
    const updatedToSingle = await Products.findByIdAndUpdate(created.id, updateToSingle);
    console.log('Updated to single return value:');
    console.log('isMultipleOption:', updatedToSingle.isMultipleOption);
    console.log('price:', updatedToSingle.price);
    
    const retrievedSingle = await Products.findById(created.id);
    console.log('Retrieved single from DB:');
    console.log('isMultipleOption:', retrievedSingle.isMultipleOption);
    console.log('price:', retrievedSingle.price);
    console.log('selections:', retrievedSingle.selections);
    
    // Cleanup
    await Products.deleteOne({ id: created.id });
    console.log('\nCleanup done.');
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testToggle().then(() => process.exit(0));
