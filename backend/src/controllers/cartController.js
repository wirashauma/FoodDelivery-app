// ============================================
// Cart Controller - Shopping Cart Management
// ============================================
// Features:
// - Cart CRUD Operations
// - Multi-Merchant Cart Detection
// - Cart Validation
// - Modifier Handling
// - Cart Summary with Pricing

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== CART OPERATIONS ====================

/**
 * Get user cart
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
            minimumOrder: true,
            deliveryFee: true,
            isActive: true,
            isOpen: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                price: true,
                discountPrice: true,
                isAvailable: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!cart) {
      return res.json({
        success: true,
        data: null,
        message: 'Cart is empty'
      });
    }

    // Validate cart items
    const validationResult = await validateCartItems(cart.items);
    
    // Calculate totals
    const summary = calculateCartSummary(cart, validationResult.validItems);

    res.json({
      success: true,
      data: {
        id: cart.id,
        merchant: cart.merchant,
        items: validationResult.validItems,
        unavailableItems: validationResult.unavailableItems,
        summary
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Add item to cart
 */
exports.addItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, modifiers, specialInstructions } = req.body;

    // Get product with merchant
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            isActive: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Product not found'
      });
    }

    if (!product.isAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Product Unavailable',
        message: 'This product is currently unavailable'
      });
    }

    if (!product.merchant.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Merchant Closed',
        message: 'This merchant is not accepting orders'
      });
    }

    // Calculate modifier price
    let modifierPrice = 0;
    let modifierDetails = [];

    if (modifiers && modifiers.length > 0) {
      const modifierIds = modifiers.map(m => m.modifierId);
      const modifierRecords = await prisma.productModifier.findMany({
        where: { id: { in: modifierIds } },
        include: { group: true }
      });

      // Validate modifiers
      for (const modifier of modifiers) {
        const record = modifierRecords.find(m => m.id === modifier.modifierId);
        if (!record) {
          return res.status(400).json({
            success: false,
            error: 'Invalid Modifier',
            message: `Modifier with ID ${modifier.modifierId} not found`
          });
        }

        const qty = modifier.quantity || 1;
        modifierPrice += record.price * qty;
        modifierDetails.push({
          id: record.id,
          name: record.name,
          groupName: record.group.name,
          price: record.price,
          quantity: qty
        });
      }
    }

    const itemPrice = product.discountPrice || product.price;
    const totalItemPrice = (itemPrice + modifierPrice) * parseInt(quantity);

    // Get or create cart
    let cart = await prisma.cart.findFirst({
      where: { userId }
    });

    // Check if cart exists with different merchant
    if (cart && cart.merchantId !== product.merchantId) {
      return res.status(409).json({
        success: false,
        error: 'Different Merchant',
        message: 'Your cart contains items from another restaurant. Clear cart to add items from this restaurant.',
        currentMerchant: cart.merchantId,
        newMerchant: product.merchantId
      });
    }

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          merchantId: product.merchantId
        }
      });
    }

    // Check if same item with same modifiers exists
    const existingItem = await findExistingCartItem(
      cart.id,
      parseInt(productId),
      modifierDetails
    );

    let cartItem;
    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + parseInt(quantity),
          totalPrice: existingItem.totalPrice + totalItemPrice
        }
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: parseInt(productId),
          productName: product.name,
          quantity: parseInt(quantity),
          unitPrice: itemPrice,
          modifiers: modifierDetails,
          modifierPrice,
          specialInstructions,
          totalPrice: totalItemPrice
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: {
        cartId: cart.id,
        item: cartItem
      }
    });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Update cart item quantity
 */
exports.updateItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;
    const { quantity, specialInstructions } = req.body;

    // Get cart item
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: parseInt(itemId) },
      include: {
        cart: true,
        product: true
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Cart item not found'
      });
    }

    // Verify ownership
    if (cartItem.cart.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have access to this cart'
      });
    }

    if (parseInt(quantity) <= 0) {
      // Remove item
      await prisma.cartItem.delete({
        where: { id: parseInt(itemId) }
      });

      // Check if cart is empty
      const remainingItems = await prisma.cartItem.count({
        where: { cartId: cartItem.cartId }
      });

      if (remainingItems === 0) {
        await prisma.cart.delete({
          where: { id: cartItem.cartId }
        });
      }

      return res.json({
        success: true,
        message: 'Item removed from cart'
      });
    }

    // Calculate new total
    const unitPrice = cartItem.unitPrice + cartItem.modifierPrice;
    const totalPrice = unitPrice * parseInt(quantity);

    const updated = await prisma.cartItem.update({
      where: { id: parseInt(itemId) },
      data: {
        quantity: parseInt(quantity),
        totalPrice,
        specialInstructions: specialInstructions !== undefined ? specialInstructions : cartItem.specialInstructions
      }
    });

    res.json({
      success: true,
      message: 'Cart item updated',
      data: updated
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Remove item from cart
 */
exports.removeItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.params;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: parseInt(itemId) },
      include: { cart: true }
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Cart item not found'
      });
    }

    if (cartItem.cart.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have access to this cart'
      });
    }

    await prisma.cartItem.delete({
      where: { id: parseInt(itemId) }
    });

    // Check if cart is empty
    const remainingItems = await prisma.cartItem.count({
      where: { cartId: cartItem.cartId }
    });

    if (remainingItems === 0) {
      await prisma.cart.delete({
        where: { id: cartItem.cartId }
      });
    }

    res.json({
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    console.error('Remove item error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Clear cart
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await prisma.cart.findFirst({
      where: { userId }
    });

    if (!cart) {
      return res.json({
        success: true,
        message: 'Cart is already empty'
      });
    }

    // Delete all cart items and cart
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      prisma.cart.delete({ where: { id: cart.id } })
    ]);

    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Replace cart (when switching merchants)
 */
exports.replaceCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity, modifiers, specialInstructions } = req.body;

    // Clear existing cart
    const existingCart = await prisma.cart.findFirst({
      where: { userId }
    });

    if (existingCart) {
      await prisma.$transaction([
        prisma.cartItem.deleteMany({ where: { cartId: existingCart.id } }),
        prisma.cart.delete({ where: { id: existingCart.id } })
      ]);
    }

    // Add new item (reuse addItem logic by calling internally)
    req.body = { productId, quantity, modifiers, specialInstructions };
    return exports.addItem(req, res);
  } catch (error) {
    console.error('Replace cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== CART VALIDATION ====================

/**
 * Validate cart before checkout
 */
exports.validateCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId, voucherCode, latitude, longitude } = req.body;

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        merchant: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Empty Cart',
        message: 'Your cart is empty'
      });
    }

    const validationErrors = [];

    // Check if merchant is active
    if (!cart.merchant.isActive) {
      validationErrors.push({
        type: 'MERCHANT_INACTIVE',
        message: 'This restaurant is currently closed'
      });
    }

    // Check if merchant is open
    if (!cart.merchant.isOpen) {
      validationErrors.push({
        type: 'MERCHANT_CLOSED',
        message: 'This restaurant is not accepting orders right now'
      });
    }

    // Check minimum order
    const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    if (subtotal < cart.merchant.minimumOrder) {
      validationErrors.push({
        type: 'MINIMUM_ORDER',
        message: `Minimum order is Rp ${cart.merchant.minimumOrder.toLocaleString()}`,
        minimumOrder: cart.merchant.minimumOrder,
        currentTotal: subtotal
      });
    }

    // Validate items availability
    const unavailableItems = [];
    for (const item of cart.items) {
      if (!item.product.isAvailable) {
        unavailableItems.push({
          itemId: item.id,
          productName: item.productName,
          message: 'This item is no longer available'
        });
      }
    }

    if (unavailableItems.length > 0) {
      validationErrors.push({
        type: 'UNAVAILABLE_ITEMS',
        message: 'Some items are no longer available',
        items: unavailableItems
      });
    }

    // Validate delivery address
    let address = null;
    let deliveryFee = cart.merchant.deliveryFee;
    let distance = 0;

    if (addressId) {
      address = await prisma.userAddress.findFirst({
        where: { id: parseInt(addressId), userId }
      });

      if (!address) {
        validationErrors.push({
          type: 'INVALID_ADDRESS',
          message: 'Selected address not found'
        });
      } else if (address.latitude && address.longitude) {
        // Calculate distance
        distance = calculateDistance(
          cart.merchant.latitude,
          cart.merchant.longitude,
          address.latitude,
          address.longitude
        );

        // Check if within delivery range (assuming 15km max)
        const maxDeliveryRadius = 15;
        if (distance > maxDeliveryRadius) {
          validationErrors.push({
            type: 'OUT_OF_RANGE',
            message: `This restaurant doesn't deliver to your area (${distance.toFixed(1)}km away)`
          });
        }

        // Calculate distance-based delivery fee
        deliveryFee = calculateDeliveryFee(distance, cart.merchant.deliveryFee);
      }
    } else if (latitude && longitude) {
      distance = calculateDistance(
        cart.merchant.latitude,
        cart.merchant.longitude,
        parseFloat(latitude),
        parseFloat(longitude)
      );
      deliveryFee = calculateDeliveryFee(distance, cart.merchant.deliveryFee);
    }

    // Validate voucher
    let voucherDiscount = 0;
    let appliedVoucher = null;

    if (voucherCode) {
      const voucher = await prisma.voucher.findFirst({
        where: { code: voucherCode.toUpperCase() }
      });

      if (!voucher) {
        validationErrors.push({
          type: 'INVALID_VOUCHER',
          message: 'Voucher code not found'
        });
      } else {
        // Validate voucher
        const voucherValidation = await validateVoucher(voucher, userId, subtotal, cart.merchantId);
        
        if (!voucherValidation.isValid) {
          validationErrors.push({
            type: 'VOUCHER_ERROR',
            message: voucherValidation.error
          });
        } else {
          appliedVoucher = voucher;
          voucherDiscount = calculateVoucherDiscount(voucher, subtotal);
        }
      }
    }

    // Calculate totals
    const platformFee = 1000; // Rp 1.000 platform fee
    const total = subtotal + deliveryFee + platformFee - voucherDiscount;

    res.json({
      success: true,
      data: {
        isValid: validationErrors.length === 0,
        errors: validationErrors,
        summary: {
          subtotal,
          deliveryFee,
          platformFee,
          voucherDiscount,
          total,
          distance: distance.toFixed(1),
          itemCount: cart.items.length
        },
        appliedVoucher: appliedVoucher ? {
          code: appliedVoucher.code,
          discount: voucherDiscount
        } : null,
        deliveryAddress: address
      }
    });
  } catch (error) {
    console.error('Validate cart error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== HELPER FUNCTIONS ====================

async function validateCartItems(items) {
  const validItems = [];
  const unavailableItems = [];

  for (const item of items) {
    if (item.product.isAvailable) {
      // Check if price changed
      const currentPrice = item.product.discountPrice || item.product.price;
      if (currentPrice !== item.unitPrice) {
        item.priceChanged = true;
        item.oldPrice = item.unitPrice;
        item.newPrice = currentPrice;
      }
      validItems.push(item);
    } else {
      unavailableItems.push(item);
    }
  }

  return { validItems, unavailableItems };
}

async function findExistingCartItem(cartId, productId, modifiers) {
  const items = await prisma.cartItem.findMany({
    where: {
      cartId,
      productId
    }
  });

  // Compare modifiers
  for (const item of items) {
    const itemModifiers = item.modifiers || [];
    
    if (modifiers.length !== itemModifiers.length) continue;
    
    const modifiersMatch = modifiers.every(m => 
      itemModifiers.some(im => im.id === m.id && im.quantity === m.quantity)
    );

    if (modifiersMatch) return item;
  }

  return null;
}

function calculateCartSummary(cart, items) {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const deliveryFee = cart.merchant.deliveryFee || 0;
  const platformFee = 1000;
  const total = subtotal + deliveryFee + platformFee;

  return {
    subtotal,
    deliveryFee,
    platformFee,
    discount: 0,
    total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    minimumOrderMet: subtotal >= (cart.merchant.minimumOrder || 0)
  };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

function calculateDeliveryFee(distance, baseDeliveryFee) {
  // Base fee + per km rate after first 3km
  const baseDistance = 3;
  const perKmRate = 2000;
  
  if (distance <= baseDistance) {
    return baseDeliveryFee || 10000;
  }
  
  const additionalDistance = distance - baseDistance;
  return (baseDeliveryFee || 10000) + (additionalDistance * perKmRate);
}

async function validateVoucher(voucher, userId, subtotal, merchantId) {
  const now = new Date();

  // Check active
  if (!voucher.isActive) {
    return { isValid: false, error: 'Voucher is not active' };
  }

  // Check dates
  if (voucher.startDate > now) {
    return { isValid: false, error: 'Voucher is not yet valid' };
  }

  if (voucher.endDate < now) {
    return { isValid: false, error: 'Voucher has expired' };
  }

  // Check minimum purchase
  if (voucher.minimumPurchase && subtotal < voucher.minimumPurchase) {
    return {
      isValid: false,
      error: `Minimum purchase of Rp ${voucher.minimumPurchase.toLocaleString()} required`
    };
  }

  // Check usage limit
  if (voucher.usageLimit) {
    const totalUsage = await prisma.voucherUsage.count({
      where: { voucherId: voucher.id }
    });
    if (totalUsage >= voucher.usageLimit) {
      return { isValid: false, error: 'Voucher usage limit reached' };
    }
  }

  // Check per user limit
  if (voucher.perUserLimit) {
    const userUsage = await prisma.voucherUsage.count({
      where: { voucherId: voucher.id, userId }
    });
    if (userUsage >= voucher.perUserLimit) {
      return { isValid: false, error: 'You have already used this voucher' };
    }
  }

  // Check merchant-specific voucher
  if (voucher.merchantId && voucher.merchantId !== merchantId) {
    return { isValid: false, error: 'Voucher not valid for this restaurant' };
  }

  // Check new user only
  if (voucher.forNewUserOnly) {
    const orderCount = await prisma.order.count({
      where: { customerId: userId, status: 'COMPLETED' }
    });
    if (orderCount > 0) {
      return { isValid: false, error: 'Voucher is only for new users' };
    }
  }

  return { isValid: true };
}

function calculateVoucherDiscount(voucher, subtotal) {
  let discount = 0;

  if (voucher.discountType === 'PERCENTAGE') {
    discount = subtotal * (voucher.discountValue / 100);
    if (voucher.maxDiscount && discount > voucher.maxDiscount) {
      discount = voucher.maxDiscount;
    }
  } else {
    discount = voucher.discountValue;
  }

  return Math.min(discount, subtotal);
}

module.exports = exports;
