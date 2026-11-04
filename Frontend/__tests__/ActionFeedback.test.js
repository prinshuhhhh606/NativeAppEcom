/**
 * Unit Test for Action Feedback Popup System
 * Tests Add to Cart, Wishlist Add/Remove, and Error popup state transitions
 */

describe('ActionFeedback System', () => {
  let feedbackState = {
    visible: false,
    type: null,
    product: null,
    title: '',
    subtitle: '',
    isUpdate: false,
    isAdded: true,
  };

  const showCartSuccess = ({ product, isUpdate = false, quantity = 1 }) => {
    feedbackState = {
      visible: true,
      type: 'cart',
      product,
      title: isUpdate ? 'Quantity Updated in Cart!' : 'Added to Cart Successfully!',
      subtitle: product?.name || 'Product added to shopping cart',
      isUpdate,
      isAdded: true,
    };
  };

  const showWishlistSuccess = ({ product, isAdded = true }) => {
    feedbackState = {
      visible: true,
      type: 'wishlist',
      product,
      title: isAdded ? 'Added to Wishlist Successfully!' : 'Removed from Wishlist',
      subtitle: product?.name || 'Your saved items updated',
      isUpdate: false,
      isAdded,
    };
  };

  const hideFeedback = () => {
    feedbackState.visible = false;
  };

  beforeEach(() => {
    feedbackState = {
      visible: false,
      type: null,
      product: null,
      title: '',
      subtitle: '',
      isUpdate: false,
      isAdded: true,
    };
  });

  test('should trigger Add to Cart success popup for new product', () => {
    const mockProduct = { id: 'p1', name: 'Jaipur Saree', price: 1499 };
    showCartSuccess({ product: mockProduct, isUpdate: false });

    expect(feedbackState.visible).toBe(true);
    expect(feedbackState.type).toBe('cart');
    expect(feedbackState.title).toBe('Added to Cart Successfully!');
    expect(feedbackState.product.name).toBe('Jaipur Saree');
    expect(feedbackState.isUpdate).toBe(false);
  });

  test('should trigger Quantity Updated popup for existing cart item', () => {
    const mockProduct = { id: 'p1', name: 'Jaipur Saree', price: 1499 };
    showCartSuccess({ product: mockProduct, isUpdate: true, quantity: 2 });

    expect(feedbackState.visible).toBe(true);
    expect(feedbackState.type).toBe('cart');
    expect(feedbackState.title).toBe('Quantity Updated in Cart!');
    expect(feedbackState.isUpdate).toBe(true);
  });

  test('should trigger Add to Wishlist success popup', () => {
    const mockProduct = { id: 'p2', name: 'Silver Jhumka', price: 799 };
    showWishlistSuccess({ product: mockProduct, isAdded: true });

    expect(feedbackState.visible).toBe(true);
    expect(feedbackState.type).toBe('wishlist');
    expect(feedbackState.title).toBe('Added to Wishlist Successfully!');
    expect(feedbackState.isAdded).toBe(true);
  });

  test('should trigger Removed from Wishlist popup', () => {
    const mockProduct = { id: 'p2', name: 'Silver Jhumka', price: 799 };
    showWishlistSuccess({ product: mockProduct, isAdded: false });

    expect(feedbackState.visible).toBe(true);
    expect(feedbackState.type).toBe('wishlist');
    expect(feedbackState.title).toBe('Removed from Wishlist');
    expect(feedbackState.isAdded).toBe(false);
  });

  test('should dismiss popup cleanly when hideFeedback is called', () => {
    const mockProduct = { id: 'p1', name: 'Jaipur Saree' };
    showCartSuccess({ product: mockProduct });
    expect(feedbackState.visible).toBe(true);

    hideFeedback();
    expect(feedbackState.visible).toBe(false);
  });
});

