from flask import Flask, jsonify
import pandas as pd

app = Flask(__name__)

# Load recommendation data
recommendations = pd.read_csv("../../data/product_recommendations.csv")


@app.route("/")
def home():
    return jsonify({
        "message": "Product Recommendation API is Running"
    })


@app.route("/recommend/<product_id>")
def recommend(product_id):

    product_id = product_id.upper()

    result = recommendations[
        recommendations["ProductID"] != product_id
    ].head(3)

    return jsonify({
        "ProductID": product_id,
        "Recommendations": result["ProductID"].tolist()
    })


if __name__ == "__main__":
    app.run(debug=True, port=5012)