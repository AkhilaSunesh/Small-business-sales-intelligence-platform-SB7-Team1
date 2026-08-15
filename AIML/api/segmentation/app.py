"""
Customer Segmentation API
Port: 5010
Gateway route: /api/customer-groups → http://localhost:5010/customer-groups
"""

import os
import joblib
from flask import Flask, jsonify, request
import pandas as pd

app = Flask(__name__)

# ── Paths for improved model and dataset ──────────────────────────────────────
_BASE = os.path.dirname(os.path.abspath(__file__))
_IMPROVED_DATA = os.path.join(_BASE, "..", "..", "data", "improved_customer_segmentation.csv")
_FALLBACK_DATA = os.path.join(_BASE, "..", "..", "data", "customer_segmentation.csv")
_MODEL = os.path.join(_BASE, "..", "..", "models", "improved_customer_segmentation.pkl")
_FEATURE_COLUMNS = [
    "TotalSpent",
    "QuantityPurchased",
    "Frequency",
    "AverageOrderValue",
    "AverageQuantityPerTransaction",
    "Recency"
]
_GROUP_COLUMN = "CustomerGroup"


def _safe_float(value, default=None):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _load_data():
    for path, label in [(_IMPROVED_DATA, "improved"), (_FALLBACK_DATA, "fallback")]:
        try:
            df = pd.read_csv(path)
            print(f"[segmentation] Loaded {len(df)} rows from {path}")
            if _GROUP_COLUMN in df.columns and df[_GROUP_COLUMN].dtype.kind in "ifu":
                df[_GROUP_COLUMN] = df[_GROUP_COLUMN].astype(int)
            return df
        except FileNotFoundError:
            print(f"[segmentation] WARNING: {label} data file not found at {path}")
        except Exception as exc:
            print(f"[segmentation] WARNING: could not load {label} data — {exc}")
    return pd.DataFrame(columns=["CustomerID", "TotalSpent", "QuantityPurchased", "Frequency", "AverageOrderValue", "AverageQuantityPerTransaction", "Recency", _GROUP_COLUMN])


def _load_model(path):
    try:
        model = joblib.load(path)
        print(f"[segmentation] Improved segmentation model loaded from {path}")
        return model
    except FileNotFoundError:
        print(f"[segmentation] WARNING: model file not found at {path}")
    except Exception as exc:
        print(f"[segmentation] WARNING: could not load model — {exc}")
    return None


def _cluster_category_mapping(model):
    default_mapping = {0: "Occasional", 1: "Loyal", 2: "High Value"}
    if model is None or not hasattr(model, "cluster_centers_"):
        return default_mapping

    centers = model.cluster_centers_
    if centers.shape[1] < len(_FEATURE_COLUMNS):
        return default_mapping

    totals = centers[:, _FEATURE_COLUMNS.index("TotalSpent")]
    freqs = centers[:, _FEATURE_COLUMNS.index("Frequency")]
    recencies = centers[:, _FEATURE_COLUMNS.index("Recency")]
    indexes = list(range(len(centers)))

    loyal_cluster = max(indexes, key=lambda idx: (freqs[idx], totals[idx], -recencies[idx]))
    remaining = [idx for idx in indexes if idx != loyal_cluster]
    high_value_cluster = max(remaining, key=lambda idx: (totals[idx], -freqs[idx], -recencies[idx]))
    occasional_cluster = next(idx for idx in indexes if idx not in {loyal_cluster, high_value_cluster})

    return {
        loyal_cluster: "Loyal",
        high_value_cluster: "High Value",
        occasional_cluster: "Occasional"
    }


def _group_name(group_id):
    if pd.isna(group_id):
        return "Unknown"
    if isinstance(group_id, str):
        return group_id
    try:
        cluster = int(group_id)
    except (ValueError, TypeError):
        return str(group_id)
    return cluster_to_category.get(cluster, f"Cluster {cluster}")


def _format_customer_row(row):
    customer_id = row.get("CustomerID")
    display_id = None
    display_name = "Unknown"
    if pd.notna(customer_id):
        try:
            numeric_id = int(customer_id)
            display_id = f"CUST-{numeric_id:04d}"
            display_name = f"Customer {numeric_id}"
        except (ValueError, TypeError):
            display_id = str(customer_id)
            display_name = f"Customer {customer_id}"

    return {
        "id": display_id,
        "name": display_name,
        "category": _group_name(row.get(_GROUP_COLUMN)),
        "totalOrders": int(row.get("Frequency")) if _safe_float(row.get("Frequency")) is not None else None,
        "totalSpent": _safe_float(row.get("TotalSpent")),
        "recency": int(row.get("Recency")) if _safe_float(row.get("Recency")) is not None else None
    }


def _build_segment_response():
    groups = (
        customer_data
        .groupby(_GROUP_COLUMN)
        .agg(count=("CustomerID", "count"))
        .reset_index()
    )

    summary = {"loyalCount": 0, "occasionalCount": 0, "highValueCount": 0}
    distribution = []
    color_map = {
        "Loyal": "#10b981",
        "Occasional": "#f59e0b",
        "High Value": "#06b6d4",
        "Unknown": "#64748b"
    }

    for _, row in groups.iterrows():
        category = _group_name(row[_GROUP_COLUMN])
        count = int(row["count"])
        distribution.append({
            "name": category,
            "value": count,
            "color": color_map.get(category, "#64748b")
        })
        if category == "Loyal":
            summary["loyalCount"] = count
        elif category == "Occasional":
            summary["occasionalCount"] = count
        elif category == "High Value":
            summary["highValueCount"] = count

    for category in ["Loyal", "Occasional", "High Value"]:
        if not any(item["name"] == category for item in distribution):
            distribution.append({
                "name": category,
                "value": 0,
                "color": color_map[category]
            })

    mixed_customers = pd.DataFrame()
    for cluster_id in cluster_to_category.keys():
        subset = customer_data[customer_data[_GROUP_COLUMN] == cluster_id]
        top_subset = subset.sort_values(by=["Frequency", "TotalSpent"], ascending=[False, False]).head(20)
        mixed_customers = pd.concat([mixed_customers, top_subset])

    customers = [
        _format_customer_row(row)
        for _, row in mixed_customers.iterrows()
    ]

    return {
        "summary": summary,
        "distribution": distribution,
        "customers": customers,
        "totalCustomers": len(customer_data)
    }


customer_data = _load_data()
segmentation_model = _load_model(_MODEL)
cluster_to_category = _cluster_category_mapping(segmentation_model)


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return jsonify({
        "success": True,
        "message": "Customer Segmentation API is Running",
        "records": len(customer_data),
        "modelLoaded": segmentation_model is not None
    })


@app.route("/health")
def health():
    return jsonify({"status": "UP"}), 200


# ── Gateway-compatible endpoint: GET /customer-groups ────────────────────────
# Called by Security_API_gateway at /api/customer-groups
@app.route("/customer-groups", methods=["GET"])
def get_customer_groups():
    if customer_data.empty:
        return jsonify({"success": False, "message": "No data available"}), 503

    response = _build_segment_response()
    response["success"] = True
    return jsonify(response)


# ── Gateway-compatible classify endpoint: POST /customer-groups/classify ─────
@app.route("/customer-groups/classify", methods=["POST"])
def classify_customer():
    payload = request.get_json(silent=True) or {}
    customer_id = payload.get("customerId") or payload.get("CustomerID")
    feature_payload = payload.get("features") or payload

    if customer_id is not None:
        try:
            customer_id = int(customer_id)
        except (ValueError, TypeError):
            pass

        customer = customer_data[customer_data["CustomerID"] == customer_id]
        if not customer.empty:
            row = customer.iloc[0]
            return jsonify({
                "success": True,
                "data": {
                    "CustomerID": int(row["CustomerID"]) if pd.notna(row["CustomerID"]) else None,
                    "CustomerGroup": int(row[_GROUP_COLUMN]) if pd.notna(row[_GROUP_COLUMN]) else None,
                    "category": _group_name(row[_GROUP_COLUMN])
                }
            })

    if segmentation_model is None:
        return jsonify({"success": False, "message": "No matching customer found and segmentation model is unavailable"}), 404

    feature_values = []
    for field in _FEATURE_COLUMNS:
        value = feature_payload.get(field)
        if value is None:
            value = feature_payload.get(field.lower())
        if value is None:
            return jsonify({"success": False, "message": f"{field} is required for segmentation classification."}), 400

        numeric_value = _safe_float(value)
        if numeric_value is None:
            return jsonify({"success": False, "message": f"{field} must be numeric."}), 400
        feature_values.append(numeric_value)

    try:
        cluster_id = int(segmentation_model.predict([feature_values])[0])
        return jsonify({
            "success": True,
            "data": {
                "CustomerGroup": cluster_id,
                "category": _group_name(cluster_id),
                "features": dict(zip(_FEATURE_COLUMNS, feature_values))
            }
        })
    except Exception as exc:
        return jsonify({"success": False, "message": f"Segmentation prediction failed: {exc}"}), 500


# ── Original endpoint (kept for backward compatibility) ──────────────────────
@app.route("/customer/<int:customer_id>", methods=["GET"])
def get_customer_group(customer_id):
    customer = customer_data[customer_data["CustomerID"] == customer_id]
    if customer.empty:
        return jsonify({"message": "Customer Not Found"}), 404
    row = customer.iloc[0]
    return jsonify({
        "CustomerID": int(row["CustomerID"]),
        "CustomerGroup": int(row[_GROUP_COLUMN]) if pd.notna(row[_GROUP_COLUMN]) else None,
        "category": _group_name(row[_GROUP_COLUMN])
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5010,
        debug=False,
        threaded=True
    )
