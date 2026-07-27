from flask import Flask, jsonify
import pandas as pd

app = Flask(__name__)

# Load churn data
customer_churn = pd.read_csv("../../data/customer_churn.csv")


@app.route("/")
def home():
    return jsonify({
        "message": "Customer Churn Prediction API is Running"
    })


@app.route("/customer/<int:customer_id>")
def predict_churn(customer_id):

    customer = customer_churn[
        customer_churn["CustomerID"] == customer_id
    ]

    if customer.empty:
        return jsonify({
            "message": "Customer Not Found"
        })

    result = customer.iloc[0]

    return jsonify({
        "CustomerID": int(result["CustomerID"]),
        "ChurnRisk": result["ChurnRisk"]
    })


if __name__ == "__main__":
    app.run(debug=True)