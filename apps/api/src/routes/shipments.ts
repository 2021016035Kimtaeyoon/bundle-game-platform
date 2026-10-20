import { Router } from 'express';
import {
  getCourierOptions,
  listMyShipments,
  listOrganizerShipments,
  updateShipmentStatus,
  updateShippingAddress,
} from '../controllers/shipmentController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../lib/asyncHandler.js';

const router = Router();

router.get('/couriers', getCourierOptions);
router.get('/mine', requireAuth, asyncHandler(listMyShipments));
router.get('/organizer', requireAuth, asyncHandler(listOrganizerShipments));
router.put('/:id/address', requireAuth, asyncHandler(updateShippingAddress));
router.put('/:id/status', requireAuth, asyncHandler(updateShipmentStatus));

export default router;
