interface AlertConfig {
  webhookUrl?: string;
  email?: string;
}

class MonitoringService {
  private alerts: AlertConfig;
  private metrics: Map<string, { count: number; lastError?: string; lastErrorTime?: Date }> = new Map();

  constructor(alerts: AlertConfig = {}) {
    this.alerts = alerts;
  }

  logError(endpoint: string, error: any, context?: any) {
    console.error(`[${endpoint}] Error:`, error, context);

    const metric = this.metrics.get(endpoint) || { count: 0 };
    metric.count++;
    metric.lastError = error.message || error.toString();
    metric.lastErrorTime = new Date();
    this.metrics.set(endpoint, metric);

    if (this.alerts.webhookUrl) {
      this.sendWebhookAlert(endpoint, error, context);
    }
  }

  logSuccess(endpoint: string) {
    const metric = this.metrics.get(endpoint);
    if (metric) {
      metric.count = 0;
      this.metrics.set(endpoint, metric);
    }
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  private async sendWebhookAlert(endpoint: string, error: any, context?: any) {
    try {
      await fetch(this.alerts.webhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert: 'API Error',
          endpoint,
          error: error.message || error.toString(),
          context,
          timestamp: new Date().toISOString(),
          metrics: this.getMetrics()
        })
      });
    } catch (alertError) {
      console.error('Failed to send alert:', alertError);
    }
  }
}

export const monitoring = new MonitoringService({
  webhookUrl: process.env.ALERT_WEBHOOK_URL
});

export function withMonitoring(handler: Function, endpoint: string) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      const result = await handler(request, ...args);
      monitoring.logSuccess(endpoint);
      return result;
    } catch (error) {
      monitoring.logError(endpoint, error, {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers)
      });
      throw error;
    }
  };
}