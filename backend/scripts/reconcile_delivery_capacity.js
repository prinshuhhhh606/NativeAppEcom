/**
 * Safe Database Reconciliation Script for Delivery Partner Active Capacity
 * 
 * Usage:
 *   Dry-run mode (default, read-only, safe):
 *     node backend/scripts/reconcile_delivery_capacity.js
 *     node backend/scripts/reconcile_delivery_capacity.js --dry-run
 * 
 *   Apply mode (updates database):
 *     node backend/scripts/reconcile_delivery_capacity.js --apply
 * 
 *   Target specific partner:
 *     node backend/scripts/reconcile_delivery_capacity.js --partner=6ae9b93cc884efcf432d3e86
 *     node backend/scripts/reconcile_delivery_capacity.js --apply --partner=6ae9b93cc884efcf432d3e86
 */

const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DeliveryPartner = require('../src/models/DeliveryPartner');
const Delivery = require('../src/models/Delivery');
const DeliveryAssignment = require('../src/models/DeliveryAssignment');
const { ACTIVE_DELIVERY_STATUSES } = require('../src/utils/deliveryCapacityUtils');

const args = process.argv.slice(2);
const isApply = args.includes('--apply');
const partnerArg = args.find(a => a.startsWith('--partner='));
const targetPartnerId = partnerArg ? partnerArg.split('=')[1] : null;

async function reconcile() {
  console.log('========================================================================');
  console.log('🔄 DELIVERY PARTNER CAPACITY RECONCILIATION SCRIPT');
  console.log(`MODE: ${isApply ? '⚠️  APPLY (Changes will be written to DB)' : '🛡️  DRY-RUN (Safe Read-Only Simulation)'}`);
  if (targetPartnerId) {
    console.log(`TARGET: Partner ID ${targetPartnerId}`);
  }
  console.log('========================================================================\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('✓ Successfully connected to MongoDB database.\n');

    const partnerQuery = targetPartnerId ? { _id: targetPartnerId } : {};
    const partners = await DeliveryPartner.find(partnerQuery);

    if (partners.length === 0) {
      console.log('No delivery partners found matching query.');
      await mongoose.disconnect();
      return;
    }

    console.log(`Found ${partners.length} delivery partner(s) to inspect.\n`);

    const summaryReport = [];

    for (const partner of partners) {
      console.log('------------------------------------------------------------------------');
      console.log(`👤 Delivery Partner: ${partner.name} (ID: ${partner._id})`);
      console.log(`   Email: ${partner.email} | Phone: ${partner.phone}`);
      console.log(`   KYC Status: ${partner.kycStatus} | Availability: ${partner.availability} (isAvailable: ${partner.isAvailable})`);
      console.log(`   Configured Active Capacity: ${partner.activeCapacity}`);
      console.log(`   Stored currentActiveDeliveries: ${partner.currentActiveDeliveries}`);

      // 1. Query actual active Delivery records
      const activeDeliveries = await Delivery.find({
        deliveryPartner: partner._id,
        status: { $in: ACTIVE_DELIVERY_STATUSES },
      }).lean();

      // All deliveries for reference
      const totalDeliveries = await Delivery.find({ deliveryPartner: partner._id }).lean();

      console.log(`\n   📦 Actual Active Delivery Records (Status in [${ACTIVE_DELIVERY_STATUSES.join(', ')}]):`);
      if (activeDeliveries.length === 0) {
        console.log('      (No genuine ongoing delivery records found in Delivery collection)');
      } else {
        activeDeliveries.forEach((d, idx) => {
          console.log(`      ${idx + 1}. Delivery ID: ${d._id}`);
          console.log(`         Delivery Number: ${d.deliveryNumber}`);
          console.log(`         Order ID: ${d.order} (Order #${d.orderNumber})`);
          console.log(`         Status: ${d.status}`);
          console.log(`         Assignment ID: ${d.assignment}`);
          console.log(`         Created At: ${d.createdAt}`);
        });
      }

      // 2. Query DeliveryAssignment records
      const assignments = await DeliveryAssignment.find({ deliveryPartner: partner._id }).lean();
      console.log(`\n   📋 Linked Delivery Assignment Requests (${assignments.length} total):`);
      const expiredRequestedAssignments = [];
      assignments.forEach((a, idx) => {
        const isExpired = a.responseDeadline && new Date(a.responseDeadline) <= new Date();
        if (a.status === 'requested' && isExpired) {
          expiredRequestedAssignments.push(a);
        }
        console.log(`      ${idx + 1}. Assignment ID: ${a.assignmentId} (DB _id: ${a._id})`);
        console.log(`         Order ID: ${a.order} (Order #${a.orderNumber})`);
        console.log(`         Status: ${a.status}`);
        console.log(`         Response Deadline: ${a.responseDeadline ? new Date(a.responseDeadline).toISOString() : 'N/A'} (Expired: ${isExpired})`);
        console.log(`         Created At: ${a.createdAt}`);
      });

      // 3. Inspect legacy assignedTasks subdocuments
      const assignedTasks = partner.assignedTasks || [];
      console.log(`\n   📑 Subdocument assignedTasks in Partner Document (${assignedTasks.length} total):`);
      assignedTasks.forEach((t, idx) => {
        console.log(`      ${idx + 1}. Task ID: ${t._id} | Order: ${t.orderNumber} | Status: ${t.status} | AssignedAt: ${t.assignedAt}`);
      });

      // 4. Calculate metrics
      const actualCount = activeDeliveries.length;
      const storedCount = partner.currentActiveDeliveries || 0;
      const capacity = Math.max(1, partner.activeCapacity || 3);
      const capacityAvailableBefore = capacity - storedCount;
      const capacityAvailableAfter = Math.max(0, capacity - actualCount);
      const drift = storedCount - actualCount;

      console.log('\n   📊 Capacity Reconciliation Summary:');
      console.log(`      Active Capacity:               ${capacity}`);
      console.log(`      Stored currentActiveDeliveries: ${storedCount}`);
      console.log(`      Actual Ongoing Deliveries:      ${actualCount}`);
      console.log(`      Drift (Over-counted):           ${drift > 0 ? `+${drift}` : drift}`);
      console.log(`      Capacity Available (Before):    ${capacityAvailableBefore}`);
      console.log(`      Capacity Available (After):     ${capacityAvailableAfter}`);

      summaryReport.push({
        partnerId: partner._id.toString(),
        name: partner.name,
        activeCapacity: capacity,
        storedCount,
        actualCount,
        drift,
        capacityAvailableBefore,
        capacityAvailableAfter,
        expiredAssignmentsCount: expiredRequestedAssignments.length,
        legacyTasksCount: assignedTasks.length,
      });

      // 5. If APPLY mode, perform safe updates
      if (isApply) {
        console.log('\n   ⚙️  Applying Database Updates:');

        // A. Recalculate and update currentActiveDeliveries to actual count
        await DeliveryPartner.findByIdAndUpdate(partner._id, {
          $set: { currentActiveDeliveries: actualCount },
        });
        console.log(`      ✓ Updated partner.currentActiveDeliveries to ${actualCount}`);

        // B. Expire past-deadline unaccepted assignments
        if (expiredRequestedAssignments.length > 0) {
          const expiredIds = expiredRequestedAssignments.map(a => a._id);
          await DeliveryAssignment.updateMany(
            { _id: { $in: expiredIds } },
            { $set: { status: 'expired' } }
          );
          console.log(`      ✓ Marked ${expiredIds.length} expired unaccepted assignment(s) as 'expired'`);
        }

        // C. Clean up orphaned tasks from assignedTasks where no matching active delivery exists
        const activeOrderNumbers = new Set(activeDeliveries.map(d => d.orderNumber));
        const updatedAssignedTasks = assignedTasks.filter(t => activeOrderNumbers.has(t.orderNumber));
        if (updatedAssignedTasks.length !== assignedTasks.length) {
          await DeliveryPartner.findByIdAndUpdate(partner._id, {
            $set: { assignedTasks: updatedAssignedTasks },
          });
          console.log(`      ✓ Cleaned up ${assignedTasks.length - updatedAssignedTasks.length} orphaned/unaccepted task(s) from assignedTasks`);
        }
      }
    }

    console.log('\n========================================================================');
    console.log('📋 FINAL RECONCILIATION SUMMARY TABLE');
    console.log('========================================================================');
    console.table(summaryReport);

    if (!isApply) {
      console.log('\n🛡️  DRY-RUN COMPLETED: No changes were written to the database.');
      console.log('To apply these fixes to the database, run:');
      console.log('   node backend/scripts/reconcile_delivery_capacity.js --apply');
      if (targetPartnerId) {
        console.log(`   node backend/scripts/reconcile_delivery_capacity.js --apply --partner=${targetPartnerId}`);
      }
    } else {
      console.log('\n✅ ALL DATABASE UPDATES APPLIED SUCCESSFULLY.');
    }

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB.');
  } catch (error) {
    console.error('\n❌ Reconciliation Error:', error);
    process.exit(1);
  }
}

reconcile();

