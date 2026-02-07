import logger from '../utils/logger';

export interface WebhookPayload {
  event: 'sync_success' | 'sync_failure' | 'sync_partial';
  timestamp: string;
  userId: number;
  keyName: string;
  message: string;
  accountsCount?: number;
}

/**
 * Sends a webhook notification to the configured URL
 */
export const sendWebhook = async (webhookUrl: string, payload: WebhookPayload): Promise<boolean> => {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Stripe-Management-API/1.0'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (response.ok) {
      logger.info(`Webhook sent successfully to ${webhookUrl}`, { status: response.status });
      return true;
    } else {
      logger.warn(`Webhook returned non-success status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error('Failed to send webhook:', error);
    return false;
  }
};

/**
 * Gets webhook URL from environment variable
 */
export const getWebhookUrl = async (_userId: number): Promise<string | null> => {
  // Return webhook URL from environment variable
  // In future, this can be enhanced to fetch from user settings table
  return process.env['WEBHOOK_URL'] || null;
};
