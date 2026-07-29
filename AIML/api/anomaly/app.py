"""
Anomaly Detection API
Port: 5013
Gateway route: /api/anomaly-detection → http://localhost:5013/anomaly-detection
"""

import os
from flask import Flask, jsonify, request
import pandas as pd

app = Flask(__name__)

# ── Data loading ──────────────────────────────────────────────────────────────
_BASE = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_BASE, "..", "..", "data", "anomaly_detection.csv")

try:
    anomaly_data = pd.read_csv(_DATA)
    print(f"[anomaly] Loaded {len(anomaly_data)} rows from {_DATA}")
except FileNotFoundError:
    print(f"[anomaly] WARNING: data file not found at {_DATA}")
    anomaly_data = pd.DataFrame(columns=["CustomerID", "Anomaly", "TotalAmount"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return jsonify({
        "success": True,
        "message": "Anomaly Detection API is Running",
        "records": len(anomaly_data)
    })


# ── Gateway-compatible endpoint: GET /anomaly-detection ──────────────────────
# Called by Security_API_gateway at /api/anomaly-detection
@app.route("/anomaly-detection", methods=["GET"])
def get_anomaly_summary():
    """Return a list of detected anomalous transactions."""
    if anomaly_data.empty:
        return jsonify({"success": False, "message": "No data available"}), 503

    anomaly_col = "Anomaly" if "Anomaly" in anomaly_data.columns else anomaly_data.columns[-1]

    flagged = anomaly_data[
        anomaly_data[anomaly_col].astype(str).str.lower().isin(["true", "1", "yes", "anomaly"])
    ]

    limit = int(request.args.get("limit", 20))

    return jsonify({
        "success": True,
        "data": flagged.head(limit).to_dict(orient="records"),
        "totalAnomalies": len(flagged),
        "totalRecords": len(anomaly_data)
    })


# ── Gateway-compatible POST: /anomaly-detection/check ────────────────────────
@app.route("/anomaly-detection/check", methods=["POST"])
def check_anomaly():
    payload = request.get_json(silent=True) or {}
    customer_id = payload.get("customerId") or payload.get("CustomerID")

    if customer_id is None:
        return jsonify({"success": False, "message": "customerId is required"}), 400

    try:
        customer_id = int(customer_id)
    except (ValueError, TypeError):
        pass

    customer = anomaly_data[anomaly_data["CustomerID"] == customer_id]

    if customer.empty:
        return jsonify({"success": False, "message": "Customer not found"}), 404

    result = customer.iloc[0]
    return jsonify({
        "success": True,
        "data": {
            "CustomerID": result.get("CustomerID"),
            "Anomaly": result.get("Anomaly"),
            "TotalAmount": float(result["TotalAmount"]) if "TotalAmount" in result else None
        }
    })


# ── Original endpoint (kept for backward compatibility) ──────────────────────
@app.route("/customer/<int:customer_id>")
def detect_anomaly(customer_id):
    customer = anomaly_data[anomaly_data["CustomerID"] == customer_id]
    if customer.empty:
        return jsonify({"message": "Customer Not Found"})
    result = customer.iloc[0]
    return jsonify({
        "CustomerID": int(result["CustomerID"]),
        "Anomaly": result["Anomaly"],
        "TotalAmount": float(result["TotalAmount"])
    })


if __name__ == "__main__":
    app.run(debug=True, port=5013)
