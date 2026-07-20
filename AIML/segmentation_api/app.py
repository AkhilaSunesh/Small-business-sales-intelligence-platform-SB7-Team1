from flask import Flask, jsonify
import pandas as pd

app = Flask(__name__)

# Load customer segmentation data
customer_data = pd.read_csv("../data/customer_segmentation.csv")


@app.route("/")
def home():
    return {
        "message": "Customer Segmentation API is Running"
    }


@app.route("/customer/<int:customer_id>", methods=["GET"])
def get_customer_group(customer_id):

    customer = customer_data[
        customer_data["CustomerID"] == customer_id
    ]

    if customer.empty:
        return jsonify({
            "message": "Customer Not Found"
        }), 404

    result = {
        "CustomerID": int(customer.iloc[0]["CustomerID"]),
        "CustomerGroup": customer.iloc[0]["CustomerGroup"]
    }

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)