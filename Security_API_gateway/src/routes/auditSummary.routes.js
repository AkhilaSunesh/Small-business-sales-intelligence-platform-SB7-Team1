/**
 * auditSummary.routes.js — Milestone 3
 *
 * GET /api/audit-summary
 * Reads the logs/audit.log file and returns a structured summary:
 *   - counts per event type
 *   - counts per user (userId)
 *   - recent entries
 *   - date range covered
 */

const express = require("express");
const fs      = require("fs");
const path    = require("path");
const router  = express.Router();

const LOG_FILE = path.join(__dirname, "../../logs", "audit.log");

function parseLogLine(line) {
    // Format: [ISO_DATE] [LEVEL] Event: <event> | Details: <json>
    const match = line.match(/^\[(.+?)\] \[(.+?)\] Event: (.+?) \| Details: (.+)$/);
    if (!match) return null;
    try {
        return {
            timestamp: match[1],
            level:     match[2],
            event:     match[3],
            details:   JSON.parse(match[4])
        };
    } catch (_) {
        return { timestamp: match[1], level: match[2], event: match[3], details: {} };
    }
}

// GET /api/audit-summary
router.get("/", (req, res) => {
    try {
        if (!fs.existsSync(LOG_FILE)) {
            return res.status(200).json({
                success: true,
                data: {
                    totalEntries: 0,
                    eventCounts:  {},
                    userCounts:   {},
                    levelCounts:  {},
                    recentEntries: [],
                    dateRange:    { from: null, to: null },
                    message:      "No audit log found yet."
                }
            });
        }

        const content  = fs.readFileSync(LOG_FILE, "utf8");
        const lines    = content.trim().split("\n").filter(Boolean);
        const parsed   = lines.map(parseLogLine).filter(Boolean);

        // Count by event type
        const eventCounts = {};
        const userCounts  = {};
        const levelCounts = {};

        for (const entry of parsed) {
            eventCounts[entry.event] = (eventCounts[entry.event] || 0) + 1;
            levelCounts[entry.level] = (levelCounts[entry.level] || 0) + 1;
            const uid = entry.details?.userId || "anonymous";
            if (uid !== "anonymous") {
                userCounts[uid] = (userCounts[uid] || 0) + 1;
            }
        }

        // Date range
        const timestamps = parsed.map(e => e.timestamp).sort();
        const dateRange  = {
            from: timestamps[0]  || null,
            to:   timestamps[timestamps.length - 1] || null
        };

        // Limit query param: ?limit=50
        const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 50));

        // Recent entries (most recent first)
        const recentEntries = parsed.slice(-limit).reverse().map(e => ({
            timestamp: e.timestamp,
            level:     e.level,
            event:     e.event,
            userId:    e.details?.userId || "anonymous",
            endpoint:  e.details?.endpoint || e.details?.url || null,
            method:    e.details?.method   || null,
            status:    e.details?.status   || null
        }));

        return res.status(200).json({
            success: true,
            data: {
                totalEntries: parsed.length,
                eventCounts,
                userCounts,
                levelCounts,
                recentEntries,
                dateRange
            }
        });
    } catch (error) {
        console.error("[auditSummary] Error reading log:", error.message);
        return res.status(500).json({ success: false, message: "Failed to read audit log." });
    }
});

module.exports = router;
