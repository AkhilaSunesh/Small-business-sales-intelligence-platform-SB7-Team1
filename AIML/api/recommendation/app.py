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
_DATA = os.path.join(_BASE, "..", "..", "data", "improved_product_recommendations.csv")
_FALLBACK_DATA = os.path.join(_BASE, "..", "..", "data", "product_recommendations.csv")


def _load_recommendations():
    try:
        df = pd.read_csv(_DATA)
        print(f"[recommendation] Loaded improved recommendations ({len(df)} rows) from {_DATA}")
        return df
    except FileNotFoundError:
        print(f"[recommendation] WARNING: improved recommendation data not found at {_DATA}")
    except Exception as exc:
        print(f"[recommendation] WARNING: could not load improved recommendation data — {exc}")

    try:
        df = pd.read_csv(_FALLBACK_DATA)
        print(f"[recommendation] Loaded fallback recommendations ({len(df)} rows) from {_FALLBACK_DATA}")
        return df
    except FileNotFoundError:
        print(f"[recommendation] WARNING: fallback recommendation data not found at {_FALLBACK_DATA}")
    except Exception as exc:
        print(f"[recommendation] WARNING: could not load fallback recommendation data — {exc}")

    return pd.DataFrame()


def _normalize_row(row):
    if "RecommendedProduct" in row.index:
        return {
            "productId": str(row["ProductID"]).upper() if pd.notna(row["ProductID"]) else None,
            "recommendedProduct": str(row["RecommendedProduct"]) if pd.notna(row["RecommendedProduct"]) else None,
            "recommendationRank": int(row["RecommendationRank"]) if pd.notna(row.get("RecommendationRank")) else None,
            "coPurchaseCount": int(row["CoPurchaseCount"]) if pd.notna(row.get("CoPurchaseCount")) else None,
            "support": float(row["Support"]) if pd.notna(row.get("Support")) else None
        }
    return {
        "productId": str(row["ProductID"]).upper() if pd.notna(row["ProductID"]) else None,
        "purchaseCount": int(row["PurchaseCount"]) if pd.notna(row.get("PurchaseCount")) else None
    }


def _normalize_dataframe(df):
    return [_normalize_row(row) for _, row in df.iterrows()]


recommendations = _load_recommendations()


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
    return jsonify({"status": "UP"}), 200


# ── Gateway-compatible endpoint: GET /recommendations ────────────────────────
# Called by Security_API_gateway at /api/recommendations
@app.route("/recommendations", methods=["GET"])
def get_recommendations():
    if recommendations.empty:
        return jsonify({"success": False, "message": "No data available"}), 503

    product_id = request.args.get("productId") or request.args.get("product_id")
    if product_id:
        product_id = str(product_id).upper()
        filtered = recommendations[recommendations["ProductID"].astype(str).str.upper() == product_id]
        if filtered.empty:
            return jsonify({
                "success": True,
                "data": [],
                "productId": product_id,
                "message": "No recommendations found for the requested product."
            })
        result = filtered.sort_values(by=["RecommendationRank"], ascending=True).head(10)
    else:
        result = recommendations
        if "RecommendationRank" in recommendations.columns:
            result = result.sort_values(by=["RecommendationRank"], ascending=True)
        result = result.head(10)

    return jsonify({
        "success": True,
        "data": _normalize_dataframe(result),
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
    filtered = recommendations[recommendations["ProductID"].astype(str).str.upper() == product_id]
    if filtered.empty:
        return jsonify({
            "success": True,
            "productId": product_id,
            "recommendations": [],
            "message": "No recommendations found for the requested product."
        })

    result = filtered.sort_values(by=["RecommendationRank"], ascending=True).head(5)
    return jsonify({
        "success": True,
        "productId": product_id,
        "recommendations": _normalize_dataframe(result)
    })


# ── Original endpoint (kept for backward compatibility) ──────────────────────
@app.route("/recommend/<product_id>")
def recommend(product_id):
    product_id = str(product_id).upper()
    if "RecommendedProduct" in recommendations.columns:
        filtered = recommendations[recommendations["ProductID"].astype(str).str.upper() == product_id]
        result = filtered.sort_values(by=["RecommendationRank"], ascending=True).head(3)
        return jsonify({
            "productId": product_id,
            "recommendations": _normalize_dataframe(result)
        })

    result = recommendations[recommendations["ProductID"].astype(str).str.upper() != product_id].head(3)
    return jsonify({
        "ProductID": product_id,
        "Recommendations": result["ProductID"].tolist()
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5012))
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
        threaded=True
    )
