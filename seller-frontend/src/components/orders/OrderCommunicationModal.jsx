import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  ShieldAlert,
  Clock,
  User,
  CheckCheck,
  RefreshCw,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';
import Modal from '../common/Modal';
import sellerService from '../../services/sellerService';
import toast from 'react-hot-toast';

export const OrderCommunicationModal = ({ isOpen, onClose, order }) => {
  const [messages, setMessages] = useState([]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const orderId = order?._id;
  const orderNumber = order?.subOrderNumber || order?.orderNumber || orderId?.slice(-6);

  // Fetch conversation and quick replies
  const loadConversation = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const [msgRes, qrRes] = await Promise.all([
        sellerService.getOrderMessages(orderId),
        sellerService.getQuickReplies(),
      ]);
      setMessages(msgRes.data || []);
      setQuickReplies(qrRes.data || []);
    } catch (err) {
      console.warn('Failed to load order messages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && orderId) {
      loadConversation();
    }
  }, [isOpen, orderId]);

  const handleSendMessage = async (msgToSend, quickReplyKey = '') => {
    const content = (msgToSend || text).trim();
    if (!content || !orderId) return;

    setSending(true);
    try {
      const res = await sellerService.sendOrderMessage(orderId, {
        text: content,
        quickReplyKey,
      });
      setMessages((prev) => [...prev, res.data]);
      setText('');
      toast.success('Message sent to customer!');
    } catch (err) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Mask customer phone for privacy
  const rawPhone = order?.shippingAddress?.phone || order?.customerPhone || '';
  const maskedPhone = rawPhone.length > 5 ? rawPhone.slice(0, 3) + '••••' + rawPhone.slice(-3) : 'Protected';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Customer Communication: Order #${orderNumber}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Customer Privacy Banner */}
        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Buyer Contact Privacy Protection Active
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Customer: <span className="font-semibold">{order?.customerName || 'Verified Buyer'}</span> • Phone: {maskedPhone} (Masked). Communication is recorded for compliance.
              </p>
            </div>
          </div>
          <button
            onClick={loadConversation}
            className="p-1 rounded-lg text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
            title="Refresh Chat"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Message History Thread */}
        <div className="h-64 overflow-y-auto p-4 rounded-2xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xs text-gray-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading communication history...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 text-xs">
              <MessageSquare className="w-8 h-8 opacity-40 mb-2" />
              <p className="font-semibold text-gray-600 dark:text-gray-300">
                No previous messages for this order
              </p>
              <p className="text-[11px] mt-0.5 max-w-xs">
                Use the quick-reply buttons below to send dispatch updates or delivery instructions.
              </p>
            </div>
          ) : (
            messages.map((m, idx) => {
              const isSeller = m.senderRole === 'seller';
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isSeller ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-gray-400 mb-0.5 px-1 font-semibold">
                    {isSeller ? 'You (Merchant)' : m.senderName || 'Customer'}
                  </span>
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isSeller
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-900 dark:text-white rounded-tl-none'
                    }`}
                  >
                    <p>{m.text}</p>
                    <span
                      className={`block text-[9px] mt-1 text-right ${
                        isSeller ? 'text-emerald-100' : 'text-gray-400'
                      }`}
                    >
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 1-Click Quick Replies Carousel */}
        {quickReplies.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Instant Quick Replies
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {quickReplies.map((qr) => (
                <button
                  key={qr.id}
                  type="button"
                  onClick={() => handleSendMessage(qr.text, qr.id)}
                  disabled={sending}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 text-[11px] font-semibold whitespace-nowrap border border-gray-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>{qr.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input & Send Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2 pt-1"
        >
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a legitimate order fulfillment message to customer..."
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Send</span>
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default OrderCommunicationModal;

