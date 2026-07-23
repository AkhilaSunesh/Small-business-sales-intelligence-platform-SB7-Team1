from flask import Flask, jsonify
import pandas as pd

app = Flask(__name__)

# Load anomaly detection data
anomaly_data = pd.read_csv("../data/anomaly_detection.csv")


@app.route("/")
def home():
    return jsonify({
        "message": "Anomaly Detection API is Running"
    })


@app.route("/customer/<int:customer_id>")
def detect_anomaly(customer_id):

    customer = anomaly_data[
        anomaly_data["CustomerID"] == customer_id
    ]

    if customer.empty:
        return jsonify({
            "message": "Customer Not Found"
        })

    result = customer.iloc[0]

    return jsonify({
        "CustomerID": int(result["CustomerID"]),
        "Anomaly": result["Anomaly"],
        "TotalAmount": float(result["TotalAmount"])
    })


if __name__ == "__main__":
    app.run(debug=True)