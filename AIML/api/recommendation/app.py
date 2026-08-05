"""
Product Recommendation API
Port: 5012
Gateway route: /api/recommendations → http://localhost:5012/recommendations
"""

import os
from flask import Flask, jsonify, request
import pandas as pd

app = Flask(__name__)

# ── Data loading ──────────────────────────────────────────────────────────────
_BASE = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_BASE, "..", "..", "data", "product_recommendations.csv")

try:
    recommendations = pd.read_csv(_DATA)
    print(f"[recommendation] Loaded {len(recommendations)} rows from {_DATA}")
except FileNotFoundError:
    print(f"[recommendation] WARNING: data file not found at {_DATA}")
    recommendations = pd.DataFrame(columns=["ProductID"])


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return jsonify({
        "success": True,
        "message": "Product Recommendation API is Running",
        "records": len(recommendations)
    })


@app.route("/health")
def health():
    return jsonify({
        "status": "UP"
    }), 200


# ── Gateway-compatible endpoint: GET /recommendations ────────────────────────
# Called by Security_API_gateway at /api/recommendations
@app.route("/recommendations", methods=["GET"])
def get_recommendations():
    """Return top product recommendations (overall popular pairings)."""
    if recommendations.empty:
        return jsonify({"success": False, "message": "No data available"}), 503

    product_id = request.args.get("productId") or request.args.get("product_id")

    if product_id:
        product_id = str(product_id).upper()
        result = recommendations[recommendations["ProductID"] != product_id].head(5)
    else:
        result = recommendations.head(10)

    return jsonify({
        "success": True,
        "data": result.to_dict(orient="records"),
        "total": len(result)
    })


# ── Gateway-compatible POST: /recommendations/for-product ─────────────────────
@app.route("/recommendations/for-product", methods=["POST"])
def recommend_for_product():
    payload = request.get_json(silent=True) or {}
    product_id = payload.get("productId") or payload.get("ProductID")

    if product_id is None:
        return jsonify({"success": False, "message": "productId is required"}), 400

    product_id = str(product_id).upper()
    result = recommendations[recommendations["ProductID"] != product_id].head(5)

    return jsonify({
        "success": True,
        "data": {
            "productId": product_id,
            "recommendations": result["ProductID"].tolist()
        }
    })


# ── Original endpoint (kept for backward compatibility) ──────────────────────
@app.route("/recommend/<product_id>")
def recommend(product_id):
    product_id = product_id.upper()
    result = recommendations[recommendations["ProductID"] != product_id].head(3)
    return jsonify({
        "ProductID": product_id,
        "Recommendations": result["ProductID"].tolist()
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5012,
        debug=False,
        threaded=True
    )