import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  storeSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#818CF8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // KPI Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F8FAFC',
  },
  kpiLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Web Portal Promo Card
  webPromoCard: {
    backgroundColor: '#312E81',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  webPromoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  webPromoDesc: {
    fontSize: 12,
    color: '#C7D2FE',
    lineHeight: 17,
    marginBottom: 12,
  },
  openWebBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openWebText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },

  // Order Row
  orderCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderNum: {
    fontSize: 13,
    fontWeight: '800',
    color: '#818CF8',
  },
  orderStatus: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#10B981',
  },
  orderItemName: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  orderDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  orderPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  // Pending Verification & Rejected Screens
  pendingCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4338CA',
    alignItems: 'center',
  },
  pendingIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#312E81',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#6366F1',
  },
  pendingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  pendingDesc: {
    fontSize: 13,
    color: '#C7D2FE',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  storeDetailsList: {
    width: '100%',
    backgroundColor: '#0F0E26',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginBottom: 16,
  },
  storeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeDetailKey: {
    fontSize: 12,
    color: '#818CF8',
    fontWeight: '600',
  },
  storeDetailVal: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  checkStatusBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  checkStatusBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default styles;

