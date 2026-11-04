/**
 * Action Feedback Context
 * Provides global animated popups for Add to Cart, Wishlist, and Action Success/Error
 * Prevents multiple overlapping popups and handles auto-dismissal.
 */
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const ActionFeedbackContext = createContext();

export const ActionFeedbackProvider = ({ children }) => {
  const [feedback, setFeedback] = useState({
    visible: false,
    type: null, // 'cart' | 'wishlist' | 'error'
    product: null,
    title: '',
    subtitle: '',
    isUpdate: false,
    isAdded: true,
  });

  const dismissTimerRef = useRef(null);

  const hideFeedback = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    setFeedback((prev) => ({ ...prev, visible: false }));
  }, []);

  /**
   * Trigger Add to Cart success popup
   */
  const showCartSuccess = useCallback(({ product, isUpdate = false, quantity = 1 }) => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    const title = isUpdate ? 'Quantity Updated in Cart!' : 'Added to Cart Successfully!';
    const subtitle = product?.name || product?.productName || 'Product added to shopping cart';

    setFeedback({
      visible: true,
      type: 'cart',
      product,
      title,
      subtitle,
      isUpdate,
      isAdded: true,
    });

    // Auto dismiss after 2.4 seconds
    dismissTimerRef.current = setTimeout(() => {
      setFeedback((prev) => ({ ...prev, visible: false }));
    }, 2400);
  }, []);

  /**
   * Trigger Wishlist toggle success popup
   */
  const showWishlistSuccess = useCallback(({ product, isAdded = true }) => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    const title = isAdded ? 'Added to Wishlist Successfully!' : 'Removed from Wishlist';
    const subtitle = product?.name || product?.productName || 'Your saved items updated';

    setFeedback({
      visible: true,
      type: 'wishlist',
      product,
      title,
      subtitle,
      isUpdate: false,
      isAdded,
    });

    // Auto dismiss after 2.0 seconds
    dismissTimerRef.current = setTimeout(() => {
      setFeedback((prev) => ({ ...prev, visible: false }));
    }, 2000);
  }, []);

  /**
   * Trigger Error popup
   */
  const showError = useCallback((message) => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }

    setFeedback({
      visible: true,
      type: 'error',
      product: null,
      title: 'Action Failed',
      subtitle: message || 'Could not complete request. Please try again.',
      isUpdate: false,
      isAdded: false,
    });

    dismissTimerRef.current = setTimeout(() => {
      setFeedback((prev) => ({ ...prev, visible: false }));
    }, 2500);
  }, []);

  return (
    <ActionFeedbackContext.Provider
      value={{
        feedback,
        showCartSuccess,
        showWishlistSuccess,
        showError,
        hideFeedback,
      }}>
      {children}
    </ActionFeedbackContext.Provider>
  );
};

export const useActionFeedback = () => {
  const context = useContext(ActionFeedbackContext);
  if (!context) {
    throw new Error('useActionFeedback must be used within an ActionFeedbackProvider');
  }
  return context;
};

export default ActionFeedbackContext;

