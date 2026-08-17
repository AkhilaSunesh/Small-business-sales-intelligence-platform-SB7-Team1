"""
Anomaly Detection API
Port: 5013
Gateway route: /api/anomaly-detection → http://localhost:5013/anomaly-detection
"""

import os
import joblib
from flask import Flask, jsonify, request
import pandas as pd

app = Flask(__name__)

# ── Paths for improved model and dataset ──────────────────────────────────────
_BASE = os.path.dirname(os.path.abspath(__file__))
_DATA = os.path.join(_BASE, "..", "..", "data", "improved_anomaly_detection.csv")
_MODEL = os.path.join(_BASE, "..", "..", "models", "improved_anomaly_detection.pkl")


def _safe_float(value, default=None):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _load_data(path):
    try:
        df = pd.read_csv(path)
        print(f"[anomaly] Loaded {len(df)} rows from {path}")
        return df
    except FileNotFoundError:
        print(f"[anomaly] WARNING: data file not found at {path}")
        return pd.DataFrame(columns=["CustomerID", "ProductID", "Quantity", "Price", "TransactionDate", "TotalAmount", "Anomaly"])
    except Exception as exc:
        print(f"[anomaly] ERROR loading data from {path}: {exc}")
        return pd.DataFrame(columns=["CustomerID", "ProductID", "Quantity", "Price", "TransactionDate", "TotalAmount", "Anomaly"])


def _load_model(path):
    try:
        model = joblib.load(path)
        print(f"[anomaly] Improved anomaly model loaded from {path}")
        return model
    except FileNotFoundError:
        print(f"[anomaly] WARNING: model file not found at {path}")
    except Exception as exc:
        print(f"[anomaly] WARNING: could not load model — {exc}")
    return None


def _is_flagged(row, model):
    anomaly_value = str(row.get("Anomaly", "")).strip().lower()
    if anomaly_value in {"true", "1", "yes", "anomaly"}:
        return True

    total_amount = _safe_float(row.get("TotalAmount"))
    if total_amount is None or model is None:
        return False

    lower = _safe_float(model.get("lower_limit"))
    upper = _safe_float(model.get("upper_limit"))
    if lower is None or upper is None:
        return False

    return total_amount < lower or total_amount > upper


def _format_record(row):
    return {
        "CustomerID": int(row.get("CustomerID")) if pd.notna(row.get("CustomerID")) else None,
        "ProductID": row.get("ProductID"),
        "Quantity": int(row.get("Quantity")) if _safe_float(row.get("Quantity")) is not None else None,
        "Price": _safe_float(row.get("Price")),
        "TransactionDate": row.get("TransactionDate"),
        "TotalAmount": _safe_float(row.get("TotalAmount")),
        "Anomaly": row.get("Anomaly")
    }


anomaly_data = _load_data(_DATA)
anomaly_model = _load_model(_MODEL)


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return jsonify({
        "success": True,
        "message": "Anomaly Detection API is Running",
        "records": len(anomaly_data),
        "modelLoaded": anomaly_model is not None
    })


@app.route("/health")
def health():
    return jsonify({"status": "UP"}), 200


# ── Gateway-compatible endpoint: GET /anomaly-detection ──────────────────────
# Called by Security_API_gateway at /api/anomaly-detection
@app.route("/anomaly-detection", methods=["GET"])
def get_anomaly_summary():
    if anomaly_data.empty:
        return jsonify({"success": False, "message": "No data available"}), 503

    limit = int(request.args.get("limit", 20))
    flagged = anomaly_data[anomaly_data.apply(lambda row: _is_flagged(row, anomaly_model), axis=1)]

    return jsonify({
        "success": True,
        "data": [ _format_record(row) for _, row in flagged.head(limit).iterrows() ],
        "totalAnomalies": len(flagged),
        "totalRecords": len(anomaly_data),
        "thresholds": {
            "lowerLimit": _safe_float(anomaly_model.get("lower_limit")) if anomaly_model else None,
            "upperLimit": _safe_float(anomaly_model.get("upper_limit")) if anomaly_model else None,
            "method": anomaly_model.get("method") if anomaly_model else None,
            "multiplier": _safe_float(anomaly_model.get("multiplier")) if anomaly_model else None
        }
    })


# ── Gateway-compatible POST: /anomaly-detection/check ────────────────────────
@app.route("/anomaly-detection/check", methods=["POST"])
def check_anomaly():
    payload = request.get_json(silent=True) or {}
    customer_id = payload.get("customerId") or payload.get("CustomerID")
    total_amount = payload.get("totalAmount") or payload.get("TotalAmount")

    if customer_id is not None:
        try:
            customer_id = int(customer_id)
        except (ValueError, TypeError):
            customer_id = None

    customer = None
    if customer_id is not None:
        customer = anomaly_data[anomaly_data["CustomerID"] == customer_id]

    if customer is not None and not customer.empty:
        result = customer.iloc[0]
        is_anomaly = _is_flagged(result, anomaly_model)
        return jsonify({
            "success": True,
            "data": _format_record(result),
            "isAnomaly": is_anomaly
        })

    if total_amount is None:
        return jsonify({"success": False, "message": "customerId or totalAmount is required"}), 400

    total_amount = _safe_float(total_amount)
    if total_amount is None:
        return jsonify({"success": False, "message": "totalAmount must be numeric"}), 400

    lower = _safe_float(anomaly_model.get("lower_limit")) if anomaly_model else None
    upper = _safe_float(anomaly_model.get("upper_limit")) if anomaly_model else None
    if lower is None or upper is None:
        return jsonify({"success": False, "message": "Anomaly model is unavailable"}), 503

    is_anomaly = total_amount < lower or total_amount > upper
    return jsonify({
        "success": True,
        "data": {
            "TotalAmount": total_amount,
            "thresholdLower": lower,
            "thresholdUpper": upper,
            "isAnomaly": is_anomaly
        }
    })


# ── Original endpoint (kept for backward compatibility) ──────────────────────
@app.route("/customer/<int:customer_id>")
def detect_anomaly(customer_id):
    customer = anomaly_data[anomaly_data["CustomerID"] == customer_id]
    if customer.empty:
        return jsonify({"message": "Customer Not Found"}), 404

    result = customer.iloc[0]
    return jsonify({
        "CustomerID": int(result["CustomerID"]),
        "Anomaly": result["Anomaly"],
        "TotalAmount": float(result["TotalAmount"])
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5013))
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
        threaded=True
    )
