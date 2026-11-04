import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  periodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  periodBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  half: {
    flex: 1,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  taxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  taxLeft: {
    flex: 1,
    marginRight: 8,
  },
  taxKey: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  taxDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  taxVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  balanceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 14,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B21A8',
  },
  balanceVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#581C87',
    marginTop: 2,
  },
  settleBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  settleBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settlementRef: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  settlementDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  settlementAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
});

export default styles;

