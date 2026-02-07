import { Router } from 'express';
import { listPaymentMethods, retrievePaymentMethod, initPaymentMethod } from '../controllers/paymentMethod.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

/**
 * POST /api/v1/payment-methods/init
 * @summary Initialize payment method setup
 * @tags Payment Methods
 * @security BearerAuth
 */
router.post('/init', initPaymentMethod);

/**
 * GET /api/v1/payment-methods
 * @summary List payment methods
 * @tags Payment Methods
 * @security BearerAuth
 * @param {integer} [accountId] accountId.query - An account ID to filter payment methods.
 * @param {integer} [year] year.query - A year to filter payment methods by creation date.
 */
router.get('/', listPaymentMethods);

/**
 * GET /api/v1/payment-methods/{paymentMethodId}
 * @summary Retrieve payment method
 * @tags Payment Methods
 * @security BearerAuth
 */
router.get('/:paymentMethodId', retrievePaymentMethod);

export default router;