/**
 * services.config.js
 * Centralized resolution and normalization for upstream service URLs.
 * Handles Render private service names (e.g., 'marketmind-backend' or 'srv-xxx'),
 * ensuring protocol ('http://'), correct ports, and path prefixes ('/api').
 */

function normalizeUrl(rawUrl, defaultPort, defaultPath = "") {
    if (!rawUrl || typeof rawUrl !== "string") {
        return `http://127.0.0.1:${defaultPort}${defaultPath}`;
    }

    let url = rawUrl.trim();

    // Prepend http:// if no protocol scheme provided
    if (!/^https?:\/\//i.test(url)) {
        url = `http://${url}`;
    }

    // Strip trailing slashes
    url = url.replace(/\/+$/, "");

    // If hostname does not have a port and is a local / private service host (not an external domain like render.com)
    // and defaultPort is specified, append port if needed.
    // Note: Render service-to-service hostnames look like "marketmind-backend" or "srv-xxx".
    // Render private networking resolves internal service names on their listening ports.
    try {
        const parsed = new URL(url);
        if (!parsed.port && defaultPort && !parsed.hostname.includes(".")) {
            parsed.port = String(defaultPort);
            url = parsed.origin;
        }
    } catch {
        // keep url as is if URL parser fails
    }

    // Append default path prefix (e.g. /api) if specified and not already present
    if (defaultPath) {
        const cleanPath = defaultPath.startsWith("/") ? defaultPath : `/${defaultPath}`;
        if (!url.endsWith(cleanPath)) {
            url = `${url}${cleanPath}`;
        }
    }

    return url;
}

const BACKEND_API_URL = normalizeUrl(
    process.env.BACKEND_API_URL,
    5000,
    "/api"
);

const CUSTOMER_SEGMENTATION_URL = normalizeUrl(
    process.env.CUSTOMER_SEGMENTATION_URL || process.env.AI_API_URL,
    5010
);

const CHURN_PREDICTION_URL = normalizeUrl(
    process.env.CHURN_PREDICTION_URL || process.env.AI_API_URL,
    5011
);

const RECOMMENDATION_URL = normalizeUrl(
    process.env.RECOMMENDATION_URL || process.env.AI_API_URL,
    5012
);

const ANOMALY_DETECTION_URL = normalizeUrl(
    process.env.ANOMALY_DETECTION_URL || process.env.AI_API_URL,
    5013
);

const FORECAST_API_URL = normalizeUrl(
    process.env.FORECAST_API_URL || process.env.AI_API_URL,
    5014
);

module.exports = {
    normalizeUrl,
    BACKEND_API_URL,
    CUSTOMER_SEGMENTATION_URL,
    CHURN_PREDICTION_URL,
    RECOMMENDATION_URL,
    ANOMALY_DETECTION_URL,
    FORECAST_API_URL
};
