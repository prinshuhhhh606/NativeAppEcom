import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Reply, RefreshCw, CheckCircle2 } from 'lucide-react';
import sellerService from '../../services/sellerService';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getReviews();
      setReviews(res.data.reviews || res.data || []);
    } catch (err) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      await sellerService.replyToReview(selectedReview._id, replyText);
      toast.success('Your seller reply was published to the customer!');
      setSelectedReview(null);
      setReplyText('');
      fetchReviews();
    } catch (err) {
      toast.error(err.message || 'Failed to submit reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Customer Ratings & Feedback
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Build customer trust by reviewing ratings and responding to buyer testimonials.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Reviews Grid */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((rev) => (
            <div
              key={rev._id}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < (rev.rating || 5) ? 'fill-current' : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-xs text-gray-900 dark:text-white">
                    {rev.customerName || rev.user?.fullName || 'Verified Buyer'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <span className="text-xs text-gray-500 font-semibold truncate max-w-xs">
                  Product: {rev.productName || rev.product?.productName || 'Catalog Product'}
                </span>
              </div>

              <p className="mt-3 text-xs text-gray-700 dark:text-gray-300 font-medium">
                "{rev.comment || rev.reviewText || 'Very high quality product, timely delivery!'}"
              </p>

              {/* Seller Reply Box if already replied */}
              {rev.sellerReply ? (
                <div className="mt-4 p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-800/60">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Your Store Response:</span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-900 dark:text-emerald-200">
                    {rev.sellerReply.replyText || rev.sellerReply}
                  </p>
                </div>
              ) : (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedReview(rev);
                      setReplyText('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-bold text-gray-700 dark:text-gray-200 transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" />
                    <span>Reply to Customer</span>
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-700 shadow-sm text-gray-400">
            <Star className="w-10 h-10 mx-auto mb-2 opacity-40 text-amber-400" />
            <p className="text-sm font-semibold">No customer reviews yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Customer ratings and reviews on your products will be displayed here.
            </p>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedReview && (
        <Modal
          isOpen={!!selectedReview}
          onClose={() => setSelectedReview(null)}
          title="Reply to Customer Review"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleReplySubmit} className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-xl text-xs">
              <p className="font-bold text-gray-900 dark:text-white mb-1">
                Customer: {selectedReview.customerName || 'Buyer'}
              </p>
              <p className="text-gray-600 dark:text-gray-300 italic">
                "{selectedReview.comment || selectedReview.reviewText || 'Product feedback'}"
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Your Public Response *
              </label>
              <textarea
                rows={3}
                required
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Thank you for your valuable feedback! We're glad you loved the quality..."
                className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors disabled:opacity-50"
              >
                {submitting ? 'Publishing...' : 'Publish Reply'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Reviews;

