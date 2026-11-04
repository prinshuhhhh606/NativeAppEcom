/**
 * Order Model & Sample Orders
 */
export const INITIAL_ORDERS = [
  {
    orderId: 'BBIN-893412-4521',
    createdAt: '2026-10-24T10:30:00Z',
    status: 'Delivered', // Placed, Confirmed, Shipped, Out for Delivery, Delivered, Cancelled
    items: [
      {
        id: 'prod_2',
        name: 'Men\'s Pure Khadi Cotton Slim-Fit Kurta',
        price: 1299,
        quantity: 1,
        selectedVariant: { color: 'Ivory White', size: 'L (40)' },
        image: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=600&q=80',
      },
    ],
    deliveryAddress: {
      fullName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      streetAddress: 'Flat 402, Lotus Towers, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      addressType: 'Home',
    },
    paymentMethod: 'UPI (Google Pay)',
    paymentStatus: 'Paid',
    summary: {
      subtotal: 1299,
      discount: 100,
      deliveryFee: 0,
      totalAmount: 1199,
    },
    tracking: [
      { status: 'Order Placed', time: '24 Oct 2026, 10:30 AM', completed: true },
      { status: 'Order Confirmed', time: '24 Oct 2026, 11:15 AM', completed: true },
      { status: 'Shipped from Hub', time: '25 Oct 2026, 04:00 PM', completed: true },
      { status: 'Out for Delivery', time: '27 Oct 2026, 09:20 AM', completed: true },
      { status: 'Delivered', time: '27 Oct 2026, 01:45 PM', completed: true },
    ],
    expectedDelivery: 'Delivered on Tue, 27 Oct',
    courierPartner: 'BlueDart Express',
    trackingNumber: 'BD982736412IN',
  },
  {
    orderId: 'BBIN-904123-7829',
    createdAt: '2026-10-29T14:10:00Z',
    status: 'Shipped',
    items: [
      {
        id: 'prod_3',
        name: 'AcousticPro ANC True Wireless Earbuds',
        price: 2499,
        quantity: 1,
        selectedVariant: { color: 'Matte Black' },
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
      },
      {
        id: 'prod_5',
        name: 'Kashmiri Mogra Grade A1 Saffron (5g Box)',
        price: 1899,
        quantity: 1,
        selectedVariant: { size: '5 Grams' },
        image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80',
      },
    ],
    deliveryAddress: {
      fullName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      streetAddress: 'Flat 402, Lotus Towers, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      pincode: '201301',
      addressType: 'Home',
    },
    paymentMethod: 'Cash on Delivery',
    paymentStatus: 'Pending on Delivery',
    summary: {
      subtotal: 4398,
      discount: 300,
      deliveryFee: 0,
      totalAmount: 4098,
    },
    tracking: [
      { status: 'Order Placed', time: '29 Oct 2026, 02:10 PM', completed: true },
      { status: 'Order Confirmed', time: '29 Oct 2026, 02:45 PM', completed: true },
      { status: 'Shipped from Hub', time: '30 Oct 2026, 08:30 AM', completed: true },
      { status: 'In Transit to Destination Hub', time: '30 Oct 2026, 09:00 PM', completed: true },
      { status: 'Out for Delivery', time: 'Expected 2 Nov', completed: false },
      { status: 'Delivered', time: 'Expected 2 Nov', completed: false },
    ],
    expectedDelivery: 'Expected by Mon, 2 Nov',
    courierPartner: 'Delhivery Surface',
    trackingNumber: 'DL384729104IN',
  },
];

export default INITIAL_ORDERS;

