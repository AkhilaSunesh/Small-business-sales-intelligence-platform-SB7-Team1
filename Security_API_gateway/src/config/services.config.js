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

    // If bare service name without dot and running on Render in production, map to onrender.com
    if (!url.includes(".") && !url.includes("localhost") && !url.includes("127.0.0.1") && process.env.NODE_ENV === "production") {
        url = `https://${url}.onrender.com`;
    } else if (!/^https?:\/\//i.test(url)) {
        url = (process.env.NODE_ENV === "production" && url.includes("onrender.com")) ? `https://${url}` : `http://${url}`;
    }

    // Strip trailing slashes
    url = url.replace(/\/+$/, "");

    // If local dev or private host without dot and not onrender.com
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
