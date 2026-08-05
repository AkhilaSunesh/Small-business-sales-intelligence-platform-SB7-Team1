"""
Customer Segmentation API
Port: 5010
Gateway route: /api/customer-groups → http://localhost:5010/customer-groups
"""

import os
from flask import Flask, jsonify, request
import pandas as pd

app = Flask(__name__)

# ── Data loading ──────────────────────────────────────────────────────────────
# Resolve path relative to this file so the service can be started from any CWD
_BASE = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_BASE, "..", "..", "data", "customer_segmentation.csv")

try:
    customer_data = pd.read_csv(_DATA)
    print(f"[segmentation] Loaded {len(customer_data)} rows from {_DATA}")
except FileNotFoundError:
    print(f"[segmentation] WARNING: data file not found at {_DATA}")
    customer_data = pd.DataFrame(columns=["CustomerID", "CustomerGroup"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return jsonify({
        "success": True,
        "message": "Customer Segmentation API is Running",
        "records": len(customer_data)
    })


@app.route("/health")
def health():
    return jsonify({
        "status": "UP"
    }), 200


# ── Gateway-compatible endpoint: GET /customer-groups ────────────────────────
# Called by Security_API_gateway at /api/customer-groups
@app.route("/customer-groups", methods=["GET"])
def get_customer_groups():
    """Return a summary of all customer segments."""
    if customer_data.empty:
        return jsonify({"success": False, "message": "No data available"}), 503

    groups = (
        customer_data
        .groupby("CustomerGroup")
        .agg(count=("CustomerID", "count"))
        .reset_index()
    )

    return jsonify({
        "success": True,
        "data": groups.to_dict(orient="records"),
        "totalCustomers": len(customer_data)
    })


# ── Gateway-compatible classify endpoint: POST /customer-groups/classify ─────
@app.route("/customer-groups/classify", methods=["POST"])
def classify_customer():
    payload = request.get_json(silent=True) or {}
    customer_id = payload.get("customerId") or payload.get("CustomerID")

    if customer_id is None:
        return jsonify({"success": False, "message": "customerId is required"}), 400

    try:
        customer_id = int(customer_id)
    except (ValueError, TypeError):
        pass  # keep as string for code-based IDs

    customer = customer_data[customer_data["CustomerID"] == customer_id]

    if customer.empty:
        return jsonify({"success": False, "message": "Customer not found"}), 404

    return jsonify({
        "success": True,
        "data": {
            "CustomerID": customer.iloc[0]["CustomerID"],
            "CustomerGroup": customer.iloc[0]["CustomerGroup"]
        }
    })


# ── Original endpoint (kept for backward compatibility) ──────────────────────
@app.route("/customer/<int:customer_id>", methods=["GET"])
def get_customer_group(customer_id):
    customer = customer_data[customer_data["CustomerID"] == customer_id]
    if customer.empty:
        return jsonify({"message": "Customer Not Found"}), 404
    return jsonify({
        "CustomerID": int(customer.iloc[0]["CustomerID"]),
        "CustomerGroup": customer.iloc[0]["CustomerGroup"]
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5010,
        debug=False,
        threaded=True
    )