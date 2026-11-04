/**
 * Location & Pan India PIN Code Context
 * Handles delivery PIN code, serviceability, delivery dates, charges across India
 */
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import pincodeService from '../services/pincodeService';
import { Config } from '../constants/config';
import { findPincodeInfo } from '../models/pincodeModel';

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [pincodeInfo, setPincodeInfo] = useState(findPincodeInfo(Config.DEFAULT_PINCODE));
  const [isLoadingPincode, setIsLoadingPincode] = useState(false);
  const [isPincodeModalVisible, setIsPincodeModalVisible] = useState(false);

  useEffect(() => {
    loadSavedPincode();
  }, []);

  const loadSavedPincode = useCallback(async () => {
    try {
      const saved = await pincodeService.getSavedPincode();
      if (saved) {
        setPincodeInfo(saved);
      }
    } catch (e) {
      console.warn('Error loading saved pincode', e);
    }
  }, []);

  useEffect(() => {
    loadSavedPincode();
  }, [loadSavedPincode]);

  /**
   * Check and apply new PIN code
   */
  const checkAndSetPincode = useCallback(async (pincode) => {
    setIsLoadingPincode(true);
    try {
      const result = await pincodeService.checkServiceability(pincode);
      if (result.isServiceable) {
        setPincodeInfo(result);
        await pincodeService.setSavedPincode(result);
        return { success: true, data: result };
      } else {
        return {
          success: false,
          message: result.message || 'PIN code is currently not serviceable',
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Failed to check PIN code serviceability',
      };
    } finally {
      setIsLoadingPincode(false);
    }
  }, []);

  const openPincodeModal = useCallback(() => setIsPincodeModalVisible(true), []);
  const closePincodeModal = useCallback(() => setIsPincodeModalVisible(false), []);

  const value = useMemo(() => ({
    pincodeInfo,
    selectedPincode: pincodeInfo?.pincode || Config.DEFAULT_PINCODE,
    cityName: pincodeInfo?.city || Config.DEFAULT_CITY,
    stateName: pincodeInfo?.state || Config.DEFAULT_STATE,
    isServiceable: pincodeInfo?.isServiceable ?? true,
    codAvailable: pincodeInfo?.codAvailable ?? true,
    deliveryDays: pincodeInfo?.deliveryDays || 3,
    isLoadingPincode,
    isPincodeModalVisible,
    checkAndSetPincode,
    openPincodeModal,
    closePincodeModal,
  }), [
    pincodeInfo,
    isLoadingPincode,
    isPincodeModalVisible,
    checkAndSetPincode,
    openPincodeModal,
    closePincodeModal,
  ]);

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
export default LocationContext;

