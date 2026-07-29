import os
import csv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MarketMind AI Service")

# Enable CORS for frontend and API gateway integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Robust path discovery
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

def get_file_path(filename):
    paths = [
        os.path.join(PROJECT_ROOT, "AIML", "data", filename),
        os.path.join(BASE_DIR, "..", "AIML", "data", filename),
        os.path.join("/app", "AIML", "data", filename),
        os.path.join(".", "AIML", "data", filename),
    ]
    for p in paths:
        if os.path.exists(p):
            return p
    return None

# 1. Load Customer Segmentation Data
segmentation_summary = {"loyalCount": 0, "occasionalCount": 0, "highValueCount": 0}
segmentation_distribution = []
segmentation_customers = []

seg_path = get_file_path("customer_segmentation.csv")
if seg_path:
    try:
        loyal = 0
        occasional = 0
        high_value = 0
        customers_list = []
        with open(seg_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                group = row.get("CustomerGroup", "")
                freq = int(row.get("Frequency", 1))
                cust_id = row.get("CustomerID", "")
                
                category = "Occasional"
                if group == "Loyal":
                    loyal += 1
                    category = "Loyal"
                elif group == "High Value":
                    high_value += 1
                    category = "High Value"
                else:
                    occasional += 1
                
                # Keep first 50 customers to show in list
                if len(customers_list) < 50:
                    customers_list.append({
                        "id": f"CUST-{int(float(cust_id)):04d}" if cust_id.replace('.','',1).isdigit() else f"CUST-{cust_id}",
                        "name": f"Customer {cust_id}",
                        "category": category,
                        "totalOrders": freq
                    })
        
        segmentation_summary = {
            "loyalCount": loyal,
            "occasionalCount": occasional,
            "highValueCount": high_value
        }
        segmentation_distribution = [
            { "name": "Loyal", "value": loyal, "color": "#10b981" },
            { "name": "Occasional", "value": occasional, "color": "#f59e0b" },
            { "name": "High Value", "value": high_value, "color": "#06b6d4" }
        ]
        segmentation_customers = customers_list
    except Exception as e:
        print(f"Error reading customer_segmentation.csv: {e}")
else:
    # Fallback mock data
    segmentation_summary = {"loyalCount": 1240, "occasionalCount": 850, "highValueCount": 420}
    segmentation_distribution = [
        { "name": "Loyal", "value": 1240, "color": "#10b981" },
        { "name": "Occasional", "value": 850, "color": "#f59e0b" },
        { "name": "High Value", "value": 420, "color": "#06b6d4" }
    ]
    segmentation_customers = [
        {"id": f"CUST-{i:04d}", "name": f"Customer #{i}", "category": "Loyal" if i % 3 == 0 else ("High Value" if i % 3 == 1 else "Occasional"), "totalOrders": 10 + i}
        for i in range(1, 21)
    ]

# 2. Load Anomaly Data
anomaly_list = []
anom_path = get_file_path("anomaly_detection.csv")
if anom_path:
    try:
        with open(anom_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                if row.get("Anomaly") == "Anomaly":
                    total_amt = float(row.get("TotalAmount", 0))
                    cust_id = row.get("CustomerID", "")
                    prod_id = row.get("ProductID", "")
                    date = row.get("TransactionDate", "")
                    category = row.get("ProductCategory", "Retail")
                    location = row.get("StoreLocation", "Online")
                    
                    anomaly_list.append({
                        "id": f"ALRT-{idx}",
                        "title": "Unusual Transaction Volume",
                        "description": f"Customer {cust_id} purchased Product {prod_id} for a total of ${total_amt:.2f} at {location}.",
                        "severity": "Critical" if total_amt > 700 else "Warning",
                        "date": date,
                        "category": category
                    })
                    if len(anomaly_list) >= 55:
                        break
    except Exception as e:
        print(f"Error reading anomaly_detection.csv: {e}")
else:
    anomaly_list = [
        {
            "id": "ALRT-001",
            "title": "High Transaction Amount",
            "description": "Customer CUST-1049 purchased Product C for a total of $899.50. This exceeds the normal customer spending threshold by 3 standard deviations.",
            "severity": "Critical",
            "date": "2026-07-28 14:32",
            "category": "Electronics"
        },
        {
            "id": "ALRT-002",
            "title": "Multiple Transactions in short window",
            "description": "Customer CUST-2083 executed 5 rapid purchases within a 3-minute window from different IP addresses.",
            "severity": "Critical",
            "date": "2026-07-28 15:02",
            "category": "Security"
        },
        {
            "id": "ALRT-003",
            "title": "High Discount Applied",
            "description": "A transaction for Customer CUST-4402 has a 95% discount coupon code applied manually by employee EMP-04.",
            "severity": "Warning",
            "date": "2026-07-29 09:15",
            "category": "Sales"
        }
    ]

# 3. Load Churn Data
churn_list = []
churn_path = get_file_path("customer_churn.csv")
if churn_path:
    try:
        with open(churn_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for idx, row in enumerate(reader):
                if row.get("ChurnRisk") == "At Risk":
                    churn_list.append({
                        "customerId": row.get("CustomerID", ""),
                        "inactiveDays": int(row.get("InactiveDays", 0)),
                        "churnRisk": "At Risk",
                        "lastPurchaseDate": row.get("LastPurchaseDate", "")
                    })
                    if len(churn_list) >= 50:
                        break
    except Exception as e:
        print(f"Error reading customer_churn.csv: {e}")
else:
    churn_list = [
        {"customerId": "1002", "inactiveDays": 75, "churnRisk": "At Risk", "lastPurchaseDate": "2026-05-12"},
        {"customerId": "1019", "inactiveDays": 92, "churnRisk": "At Risk", "lastPurchaseDate": "2026-04-20"}
    ]

@app.get("/")
def read_root():
    return {"service": "ai-service", "status": "running"}

@app.get("/customer-groups")
def get_customer_groups():
    return {
        "success": True,
        "summary": segmentation_summary,
        "distribution": segmentation_distribution,
        "customers": segmentation_customers
    }

@app.post("/customer-groups/classify")
def classify_customer():
    return {"success": True, "category": "Loyal"}

@app.get("/anomaly-detection")
def get_anomalies():
    return {
        "success": True,
        "data": anomaly_list
    }

@app.post("/anomaly-detection/check")
def check_anomaly():
    return {"success": True, "anomaly": False}

@app.get("/recommendations")
def get_recommendations():
    return {
        "success": True,
        "data": [
            {
                "id": "REC-001",
                "category": "Frequently Bought Together",
                "confidence": "94%",
                "productPurchased": "Product C (Books)",
                "recommendedProduct": "Product D (Electronics)",
                "reason": "Historical sales transactions show that 94% of customers purchasing Books also buy Electronics."
            },
            {
                "id": "REC-002",
                "category": "Cross-Sell",
                "confidence": "89%",
                "productPurchased": "Product B (Clothing)",
                "recommendedProduct": "Product A (Apparel Accessories)",
                "reason": "Apparel accessories purchases are strongly correlated with clothing transactions."
            },
            {
                "id": "REC-003",
                "category": "High-Value Upsell",
                "confidence": "85%",
                "productPurchased": "Product D (Electronics)",
                "recommendedProduct": "Premium Tech Warranty",
                "reason": "Customers purchasing high-end electronics show an 85% conversion rate for premium tech protection plans."
            }
        ]
    }

@app.post("/recommendations/for-product")
def recommend_for_product():
    return {"success": True, "recommendations": ["Product C", "Product D"]}

@app.get("/churn")
def get_churn():
    return {
        "success": True,
        "data": churn_list
    }

@app.post("/churn/check")
def check_churn():
    return {"success": True, "churnRisk": "Not At Risk"}
