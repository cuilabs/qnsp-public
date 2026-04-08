/**
 * Notification Delivery Service
 * Handles email, webhook, and API notifications for GDPR/HIPAA compliance
 */

import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";

export interface NotificationOptions {
	readonly method: "email" | "webhook" | "api";
	readonly recipient: string;
	readonly subject?: string;
	readonly template?: string;
	readonly data?: Record<string, unknown>;
	readonly metadata?: Record<string, unknown>;
}

export interface NotificationResult {
	readonly notificationId: string;
	readonly method: NotificationOptions["method"];
	readonly recipient: string;
	readonly status: "pending" | "sent" | "failed";
	readonly sentAt?: string;
	readonly error?: string;
}

export interface EmailNotificationOptions extends NotificationOptions {
	readonly method: "email";
	readonly subject: string;
	readonly body: string;
	readonly htmlBody?: string;
}

export interface WebhookNotificationOptions extends NotificationOptions {
	readonly method: "webhook";
	readonly url: string;
	readonly payload: unknown;
	readonly headers?: Record<string, string>;
}

export interface ApiNotificationOptions extends NotificationOptions {
	readonly method: "api";
	readonly endpoint: string;
	readonly payload: unknown;
	readonly headers?: Record<string, string>;
}

export class NotificationService {
	private readonly emailTransporter: Transporter | null;

	constructor(
		private readonly emailConfig?: {
			readonly smtpHost: string;
			readonly smtpPort: number;
			readonly smtpUser: string;
			readonly smtpPassword: string;
			readonly fromEmail: string;
			readonly smtpSecure?: boolean;
			readonly smtpTls?: {
				readonly rejectUnauthorized?: boolean;
				readonly ciphers?: string;
			};
		},
	) {
		// Initialize SMTP transporter if email config is provided
		if (emailConfig) {
			this.emailTransporter = nodemailer.createTransport({
				host: emailConfig.smtpHost,
				port: emailConfig.smtpPort,
				secure: emailConfig.smtpSecure ?? emailConfig.smtpPort === 465,
				auth: {
					user: emailConfig.smtpUser,
					pass: emailConfig.smtpPassword,
				},
				tls: emailConfig.smtpTls,
			});
		} else {
			this.emailTransporter = null;
		}
	}

	/**
	 * Send a notification
	 */
	async sendNotification(options: NotificationOptions): Promise<NotificationResult> {
		const notificationId = crypto.randomUUID();

		try {
			switch (options.method) {
				case "email":
					await this.sendEmail(options as EmailNotificationOptions);
					break;
				case "webhook":
					await this.sendWebhook(options as WebhookNotificationOptions);
					break;
				case "api":
					await this.sendApi(options as ApiNotificationOptions);
					break;
			}

			return {
				notificationId,
				method: options.method,
				recipient: options.recipient,
				status: "sent",
				sentAt: new Date().toISOString(),
			};
		} catch (error) {
			return {
				notificationId,
				method: options.method,
				recipient: options.recipient,
				status: "failed",
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	private async sendEmail(options: EmailNotificationOptions): Promise<void> {
		if (!this.emailConfig || !this.emailTransporter) {
			throw new Error("Email configuration not provided");
		}

		const mailOptions = {
			from: this.emailConfig.fromEmail,
			to: options.recipient,
			subject: options.subject,
			text: options.body,
			html: options.htmlBody,
		};

		// Send email via SMTP using nodemailer
		const info = await this.emailTransporter.sendMail(mailOptions);

		// Verify email was accepted by SMTP server
		if (!info.messageId) {
			throw new Error("Email was not accepted by SMTP server");
		}
	}

	private async sendWebhook(options: WebhookNotificationOptions): Promise<void> {
		const response = await fetch(options.url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			body: JSON.stringify(options.payload),
		});

		if (!response.ok) {
			throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
		}
	}

	private async sendApi(options: ApiNotificationOptions): Promise<void> {
		const response = await fetch(options.endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...options.headers,
			},
			body: JSON.stringify(options.payload),
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status} ${response.statusText}`);
		}
	}

	/**
	 * Send GDPR breach notification
	 */
	async sendGdprBreachNotification(
		recipient: string,
		breachDetails: {
			readonly breachId: string;
			readonly detectedAt: string;
			readonly description: string;
			readonly affectedResources: readonly string[];
		},
		method: "email" | "webhook" = "email",
	): Promise<NotificationResult> {
		const subject = "GDPR Data Breach Notification";
		const body = `A data breach has been detected in your QNSP account.

Breach ID: ${breachDetails.breachId}
Detected At: ${breachDetails.detectedAt}
Description: ${breachDetails.description}
Affected Resources: ${breachDetails.affectedResources.join(", ")}

This notification is required under GDPR Article 33 (notification to supervisory authority within 72 hours).

Please review the breach details and take appropriate action.`;

		if (method === "email") {
			return this.sendNotification({
				method: "email",
				recipient,
				subject,
				body,
			} as EmailNotificationOptions);
		}

		return this.sendNotification({
			method: "webhook",
			recipient,
			url: recipient,
			payload: {
				type: "gdpr_breach_notification",
				breachId: breachDetails.breachId,
				detectedAt: breachDetails.detectedAt,
				description: breachDetails.description,
				affectedResources: breachDetails.affectedResources,
			},
		} as WebhookNotificationOptions);
	}

	/**
	 * Send HIPAA breach notification
	 */
	async sendHipaaBreachNotification(
		recipient: string,
		incidentDetails: {
			readonly incidentId: string;
			readonly detectedAt: string;
			readonly description: string;
			readonly affectedIndividuals?: number;
			readonly ephiAffected: boolean;
		},
		method: "email" | "webhook" = "email",
	): Promise<NotificationResult> {
		const subject = "HIPAA Security Incident Notification";
		const body = `A security incident involving ePHI has been detected in your QNSP account.

Incident ID: ${incidentDetails.incidentId}
Detected At: ${incidentDetails.detectedAt}
Description: ${incidentDetails.description}
ePHI Affected: ${incidentDetails.ephiAffected ? "Yes" : "No"}
${incidentDetails.affectedIndividuals ? `Affected Individuals: ${incidentDetails.affectedIndividuals}` : ""}

This notification is required under HIPAA Security Rule (45 CFR §164.408).

Please review the incident details and take appropriate action.`;

		if (method === "email") {
			return this.sendNotification({
				method: "email",
				recipient,
				subject,
				body,
			} as EmailNotificationOptions);
		}

		return this.sendNotification({
			method: "webhook",
			recipient,
			url: recipient,
			payload: {
				type: "hipaa_incident_notification",
				incidentId: incidentDetails.incidentId,
				detectedAt: incidentDetails.detectedAt,
				description: incidentDetails.description,
				affectedIndividuals: incidentDetails.affectedIndividuals,
				ephiAffected: incidentDetails.ephiAffected,
			},
		} as WebhookNotificationOptions);
	}
}
