declare module "nodemailer" {
	export interface SentMessageInfo {
		readonly messageId?: string;
	}

	export interface Transporter {
		sendMail(mailOptions: unknown): Promise<SentMessageInfo>;
	}

	export interface TransportOptions {
		readonly host?: string;
		readonly port?: number;
		readonly secure?: boolean;
		readonly auth?: {
			readonly user?: string;
			readonly pass?: string;
		};
		readonly tls?:
			| {
					readonly rejectUnauthorized?: boolean;
					readonly ciphers?: string;
			  }
			| undefined;
	}

	export function createTransport(options: TransportOptions): Transporter;
}
