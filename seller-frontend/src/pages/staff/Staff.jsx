import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Clock,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Calendar,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import sellerService from '../../services/sellerService';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

export const Staff = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'packing_staff',
    shift: 'Morning (09:00 AM - 06:00 PM)',
  });

  const [attendanceData, setAttendanceData] = useState({
    status: 'present',
    notes: 'Regular on-time shift fulfillment',
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await sellerService.getStaff();
      setStaff(res.data || []);
    } catch (err) {
      toast.error('Failed to load store team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    try {
      await sellerService.inviteStaff(formData);
      toast.success('Staff employee added successfully!');
      setIsInviteOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'packing_staff',
        shift: 'Morning (09:00 AM - 06:00 PM)',
      });
      fetchStaff();
    } catch (err) {
      toast.error(err.message || 'Failed to add employee');
    }
  };

  const handleToggleStatus = async (employee) => {
    try {
      await sellerService.toggleStaffStatus(employee._id);
      toast.success(
        `Staff access ${employee.status === 'active' ? 'revoked' : 'restored'} successfully`
      );
      fetchStaff();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle status');
    }
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your store team?`)) return;
    try {
      await sellerService.deleteStaff(id);
      toast.success('Employee removed from store team');
      fetchStaff();
    } catch (err) {
      toast.error(err.message || 'Failed to remove staff');
    }
  };

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      await sellerService.recordAttendance(selectedEmployee._id, attendanceData);
      toast.success(`Attendance logged for ${selectedEmployee.name}!`);
      setIsAttendanceOpen(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.message || 'Failed to record attendance');
    }
  };

  const roleBadges = {
    owner: { label: 'Store Owner', bg: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300' },
    manager: { label: 'General Manager', bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' },
    order_manager: { label: 'Order Dispatcher', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
    inventory_manager: { label: 'Warehouse Manager', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
    packing_staff: { label: 'Packing Staff', bg: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300' },
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span>Store Staff & Employee Management</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Delegate operational duties, configure permission-based roles, schedule shifts, and track team attendance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStaff}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Refresh Staff"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Employee</span>
          </button>
        </div>
      </div>

      {/* Staff Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/70 dark:bg-slate-900/40 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-4 px-5">Employee</th>
                <th className="py-4 px-4">Role & Access</th>
                <th className="py-4 px-4">Work Shift</th>
                <th className="py-4 px-4">Permissions</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-500" />
                    <span>Loading store team...</span>
                  </td>
                </tr>
              ) : staff.length > 0 ? (
                staff.map((emp) => {
                  const badge = roleBadges[emp.role] || roleBadges.packing_staff;
                  return (
                    <tr
                      key={emp._id}
                      className="hover:bg-gray-50/70 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                            {emp.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-extrabold text-gray-900 dark:text-white">{emp.name}</p>
                            <p className="text-[11px] text-gray-400 font-mono">
                              {emp.email} {emp.phone ? `• ${emp.phone}` : ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{emp.shift}</span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {emp.permissions?.length || 0} modules assigned
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            emp.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          }`}
                        >
                          {emp.status === 'active' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span className="capitalize">{emp.status}</span>
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Log Attendance Button */}
                          <button
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setIsAttendanceOpen(true);
                            }}
                            className="p-1.5 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-emerald-600 dark:bg-slate-700 dark:text-gray-300 transition-colors"
                            title="Log Shift Attendance"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          {/* Toggle Access Button */}
                          <button
                            onClick={() => handleToggleStatus(emp)}
                            className="p-1.5 rounded-xl bg-gray-100 hover:bg-amber-50 text-gray-600 hover:text-amber-600 dark:bg-slate-700 dark:text-gray-300 transition-colors"
                            title={emp.status === 'active' ? 'Revoke Access' : 'Restore Access'}
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteStaff(emp._id, emp.name)}
                            className="p-1.5 rounded-xl bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 dark:bg-slate-700 dark:text-gray-300 transition-colors"
                            title="Remove Employee"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      No Staff Employees Added Yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">
                      Add warehouse workers, order fulfillment managers, or inventory assistants.
                    </p>
                    <button
                      onClick={() => setIsInviteOpen(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                    >
                      + Add First Employee
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Invite Employee Modal */}
      <Modal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Add Store Staff Member"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Employee Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Ramesh Sharma"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="ramesh@mybusiness.in"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Mobile Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="9876543210"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Assigned Store Role
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
            >
              <option value="packing_staff">Packing Staff (Warehouse Pack & Label)</option>
              <option value="order_manager">Order Dispatcher (Fulfillment & Shipping)</option>
              <option value="inventory_manager">Inventory Manager (Stock & Barcode Adjust)</option>
              <option value="manager">Store Manager (Operational Access)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Scheduled Shift
            </label>
            <input
              type="text"
              value={formData.shift}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
              placeholder="Morning (09:00 AM - 06:00 PM)"
              className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Save Employee
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Attendance Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={isAttendanceOpen}
          onClose={() => setIsAttendanceOpen(false)}
          title={`Log Shift Attendance: ${selectedEmployee.name}`}
          maxWidth="max-w-sm"
        >
          <form onSubmit={handleAttendanceSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Attendance Status
              </label>
              <select
                value={attendanceData.status}
                onChange={(e) => setAttendanceData({ ...attendanceData, status: e.target.value })}
                className="mt-1 block w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
              >
                <option value="present">Present (Full Day)</option>
                <option value="half_day">Half Day Shift</option>
                <option value="on_leave">Approved Leave</option>
                <option value="absent">Absent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Notes / Remarks
              </label>
              <input
                type="text"
                value={attendanceData.notes}
                onChange={(e) => setAttendanceData({ ...attendanceData, notes: e.target.value })}
                placeholder="e.g. Completed morning packing shift"
                className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAttendanceOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                Save Attendance
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Staff;

