const { generateForecast } = require("../services/forecast.service");

// ─── GET /api/forecast ────────────────────────────────────────────────────────
// Query params:
//   days    — number of future days to forecast  (1–365, default 30)
//   lookback — historical days to base SMA on    (7–365, default 90)
//   window   — SMA window size in days            (2–30,  default 7)
exports.getForecast = async (req, res) => {
    try {
        // ── Input validation ──────────────────────────────────────────────────
        const days = parseInt(req.query.days, 10) || 30;
        if (days < 1 || days > 365) {
            return res.status(400).json({
                success: false,
                message: "Query param 'days' must be between 1 and 365."
            });
        }

        const lookback = parseInt(req.query.lookback, 10) || 90;
        if (lookback < 7 || lookback > 365) {
            return res.status(400).json({
                success: false,
                message: "Query param 'lookback' must be between 7 and 365."
            });
        }

        const smaWindow = parseInt(req.query.window, 10) || 7;
        if (smaWindow < 2 || smaWindow > 30) {
            return res.status(400).json({
                success: false,
                message: "Query param 'window' must be between 2 and 30."
            });
        }

        // ── Generate forecast ─────────────────────────────────────────────────
        const category = req.query.category || 'all';
        const result = await generateForecast(days, lookback, smaWindow, category);

        return res.status(200).json({
            success:     true,
            period:      result.period,
            lookback:    result.lookback,
            smaWindow:   result.smaWindow,
            generatedAt: result.generatedAt,
            forecast:    result.forecast,
            historical:  result.historical
        });
    } catch (error) {
        console.error("Forecast error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to generate forecast."
        });
    }
};
