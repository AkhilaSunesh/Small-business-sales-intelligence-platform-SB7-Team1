"""
Churn Prediction API
Port: 5011
Gateway route: /api/churn → http://localhost:5011/churn
"""

import os
from flask import Flask, jsonify, request
import pandas as pd

app = Flask(__name__)

# ── Data loading ──────────────────────────────────────────────────────────────
_BASE = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_BASE, "..", "..", "data", "customer_churn.csv")

try:
    customer_churn = pd.read_csv(_DATA)
    print(f"[churn] Loaded {len(customer_churn)} rows from {_DATA}")
except FileNotFoundError:
    print(f"[churn] WARNING: data file not found at {_DATA}")
    customer_churn = pd.DataFrame(columns=["CustomerID", "ChurnRisk"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return jsonify({
        "success": True,
        "message": "Customer Churn Prediction API is Running",
        "records": len(customer_churn)
    })


@app.route("/health")
def health():
    return jsonify({
        "status": "UP"
    }), 200


# ── Gateway-compatible endpoint: GET /churn ───────────────────────────────────
# Called by Security_API_gateway at /api/churn
@app.route("/churn", methods=["GET"])
def get_churn_summary():
    """Return a summary of churn risk distribution."""
    if customer_churn.empty:
        return jsonify({"success": False, "message": "No data available"}), 503

    risk_col = "ChurnRisk" if "ChurnRisk" in customer_churn.columns else customer_churn.columns[-1]

    distribution = (
        customer_churn
        .groupby(risk_col)
        .agg(count=("CustomerID", "count"))
        .reset_index()
        .rename(columns={risk_col: "churnRisk"})
    )

    high_risk = customer_churn[customer_churn[risk_col].astype(str).str.lower().isin(["high", "1", "true"])]

    return jsonify({
        "success": True,
        "data": {
            "distribution": distribution.to_dict(orient="records"),
            "totalCustomers": len(customer_churn),
            "highRiskCount": len(high_risk),
            "highRiskSample": high_risk.head(10).to_dict(orient="records")
        }
    })


# ── Gateway-compatible POST: /churn/check ─────────────────────────────────────
@app.route("/churn/check", methods=["POST"])
def check_churn():
    payload = request.get_json(silent=True) or {}
    customer_id = payload.get("customerId") or payload.get("CustomerID")

    if customer_id is None:
        return jsonify({"success": False, "message": "customerId is required"}), 400

    try:
        customer_id = int(customer_id)
    except (ValueError, TypeError):
        pass

    customer = customer_churn[customer_churn["CustomerID"] == customer_id]

    if customer.empty:
        return jsonify({"success": False, "message": "Customer not found"}), 404

    result = customer.iloc[0]
    return jsonify({
        "success": True,
        "data": {
            "CustomerID": result["CustomerID"],
            "ChurnRisk": result["ChurnRisk"]
        }
    })


# ── Original endpoint (kept for backward compatibility) ──────────────────────
@app.route("/customer/<int:customer_id>")
def predict_churn(customer_id):
    customer = customer_churn[customer_churn["CustomerID"] == customer_id]
    if customer.empty:
        return jsonify({"message": "Customer Not Found"})
    result = customer.iloc[0]
    return jsonify({
        "CustomerID": int(result["CustomerID"]),
        "ChurnRisk": result["ChurnRisk"]
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5011,
        debug=False,
        threaded=True
    )