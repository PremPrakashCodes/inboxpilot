export const OTP_TTL_SECONDS = 10 * 60;
export const API_KEY_TTL_SECONDS = 30 * 24 * 60 * 60;

export const EXPIRY_OPTIONS: Record<string, number> = {
	"1d": 1 * 24 * 60 * 60,
	"7d": 7 * 24 * 60 * 60,
	"1m": 30 * 24 * 60 * 60,
	never: 0,
};
