const express = require('express');
const router = express.Router();
const { Products } = require('../config/db');
const { verifyAdmin } = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');

// GET /api/products - Get all supplements catalog
router.get('/', async (req, res) => {
  try {
    const list = await Products.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving products', error: err.message });
  }
});

// GET /api/products/:id - Get specific product details
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving product', error: err.message });
  }
});

// POST /api/products - Admin: Create new product listing
router.post('/', verifyAdmin, async (req, res) => {
  const { name, description, price, image, images, category, stock, allowKoko, isMultipleOption, optionTitle, selectionType, selections } = req.body;

  if (!name || !price || !category || stock === undefined) {
    return res.status(400).json({ message: 'Name, price, category, and stock are required' });
  }

  try {
    let imageList = [];
    
    if (images && Array.isArray(images)) {
      for (let img of images) {
        if (img && img.startsWith('data:image/')) {
          if (cloudinary.isConfigured) {
            const uploadedUrl = await cloudinary.uploadImage(img);
            if (uploadedUrl) {
              imageList.push(uploadedUrl);
            } else {
              imageList.push(img);
            }
          } else {
            imageList.push(img);
          }
        } else if (img) {
          imageList.push(img);
        }
      }
    }

    if (imageList.length === 0 && image) {
      if (image.startsWith('data:image/')) {
        if (cloudinary.isConfigured) {
          const uploadedUrl = await cloudinary.uploadImage(image);
          if (uploadedUrl) {
            imageList.push(uploadedUrl);
          } else {
            imageList.push(image);
          }
        } else {
          imageList.push(image);
        }
      } else {
        imageList.push(image);
      }
    }

    const mainImage = imageList[0] || 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=500&auto=format&fit=crop&q=60';

    let processedSelections = [];
    if (selections) {
      const sels = typeof selections === 'string' ? JSON.parse(selections) : selections;
      if (Array.isArray(sels)) {
        for (let sel of sels) {
          let selImg = sel.image || '';
          if (selImg && selImg.startsWith('data:image/')) {
            if (cloudinary.isConfigured) {
              const uploadedUrl = await cloudinary.uploadImage(selImg);
              if (uploadedUrl) {
                selImg = uploadedUrl;
              }
            }
          }
          processedSelections.push({
            id: sel.id || Math.random().toString(36).substr(2, 9),
            name: sel.name || '',
            price: parseFloat(sel.price || 0),
            description: sel.description || '',
            image: selImg
          });
        }
      }
    }

    const isMult = isMultipleOption === true || isMultipleOption === 'true';
    let finalPrice = parseFloat(price);
    let finalDescription = description || '';
    let finalImage = mainImage;
    let finalImages = imageList;

    if (isMult && processedSelections.length > 0) {
      finalPrice = processedSelections[0].price;
      if (processedSelections[0].description) {
        finalDescription = processedSelections[0].description;
      }
      if (processedSelections[0].image) {
        finalImage = processedSelections[0].image;
        finalImages = [processedSelections[0].image, ...imageList.filter(x => x !== processedSelections[0].image)];
      }
    }

    const newProduct = await Products.create({
      name,
      description: finalDescription,
      price: finalPrice,
      image: finalImage,
      images: finalImages,
      category,
      stock: parseInt(stock),
      rating: 5.0,
      allowKoko: allowKoko === true || allowKoko === 'true',
      isMultipleOption: isMult,
      optionTitle: optionTitle || '',
      selectionType: selectionType || 'dropdown',
      selections: processedSelections
    });

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error creating product', error: err.message });
  }
});

// PUT /api/products/:id - Admin: Edit product details
router.put('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, image, images, category, stock, allowKoko, isMultipleOption, optionTitle, selectionType, selections } = req.body;

  try {
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let imageList = [];
    
    if (images && Array.isArray(images)) {
      for (let img of images) {
        if (img && img.startsWith('data:image/')) {
          if (cloudinary.isConfigured) {
            const uploadedUrl = await cloudinary.uploadImage(img);
            if (uploadedUrl) {
              imageList.push(uploadedUrl);
            } else {
              imageList.push(img);
            }
          } else {
            imageList.push(img);
          }
        } else if (img) {
          imageList.push(img);
        }
      }
    }

    if (imageList.length === 0) {
      if (image) {
        if (image.startsWith('data:image/')) {
          if (cloudinary.isConfigured) {
            const uploadedUrl = await cloudinary.uploadImage(image);
            if (uploadedUrl) {
              imageList.push(uploadedUrl);
            } else {
              imageList.push(image);
            }
          } else {
            imageList.push(image);
          }
        } else {
          imageList.push(image);
        }
      } else {
        imageList = product.images || (product.image ? [product.image] : []);
      }
    }

    const mainImage = imageList[0] || product.image || 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=500&auto=format&fit=crop&q=60';

    let processedSelections = [];
    if (selections) {
      const sels = typeof selections === 'string' ? JSON.parse(selections) : selections;
      if (Array.isArray(sels)) {
        for (let sel of sels) {
          let selImg = sel.image || '';
          if (selImg && selImg.startsWith('data:image/')) {
            if (cloudinary.isConfigured) {
              const uploadedUrl = await cloudinary.uploadImage(selImg);
              if (uploadedUrl) {
                selImg = uploadedUrl;
              }
            }
          }
          processedSelections.push({
            id: sel.id || Math.random().toString(36).substr(2, 9),
            name: sel.name || '',
            price: parseFloat(sel.price || 0),
            description: sel.description || '',
            image: selImg
          });
        }
      }
    }

    const isMult = isMultipleOption !== undefined ? (isMultipleOption === true || isMultipleOption === 'true') : product.isMultipleOption;
    let finalPrice = price !== undefined ? parseFloat(price) : product.price;
    let finalDescription = description !== undefined ? description : product.description;
    let finalImage = mainImage;
    let finalImages = imageList;

    if (isMult && processedSelections.length > 0) {
      finalPrice = processedSelections[0].price;
      if (processedSelections[0].description) {
        finalDescription = processedSelections[0].description;
      }
      if (processedSelections[0].image) {
        finalImage = processedSelections[0].image;
        finalImages = [processedSelections[0].image, ...imageList.filter(x => x !== processedSelections[0].image)];
      }
    }

    const updated = await Products.findByIdAndUpdate(id, {
      name: name || product.name,
      description: finalDescription,
      price: finalPrice,
      image: finalImage,
      images: finalImages,
      category: category || product.category,
      stock: stock !== undefined ? parseInt(stock) : product.stock,
      allowKoko: allowKoko !== undefined ? (allowKoko === true || allowKoko === 'true') : product.allowKoko,
      isMultipleOption: isMult,
      optionTitle: optionTitle !== undefined ? optionTitle : product.optionTitle,
      selectionType: selectionType !== undefined ? selectionType : product.selectionType,
      selections: selections !== undefined ? processedSelections : product.selections
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
});

// DELETE /api/products/:id - Admin: Delete product listing
router.delete('/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Products.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await Products.deleteOne({ id });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product', error: err.message });
  }
});

module.exports = router;
