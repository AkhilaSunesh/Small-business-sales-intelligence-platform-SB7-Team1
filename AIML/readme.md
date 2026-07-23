# AIML Module - MarketMind AI

## Overview

The AIML module powers the intelligent features of **MarketMind AI**. It performs data preprocessing, sales forecasting, customer segmentation, churn prediction, product recommendation, and anomaly detection while exposing each functionality through REST APIs for backend integration.

---

# Folder Structure

```
AIML/
│
├── api/
│   ├── forecast/
│   │   └── app.py
│   ├── segmentation/
│   │   └── app.py
│   ├── churn/
│   │   └── app.py
│   ├── recommendation/
│   │   └── app.py
│   └── anomaly/
│       └── app.py
│
├── data/
│   ├── Retail_Transaction_Dataset.csv
│   ├── preprocessed_data.csv
│   ├── customer_segmentation.csv
│   ├── customer_churn.csv
│   ├── product_recommendations.csv
│   └── anomaly_detection.csv
│
├── models/
│   └── prophet_sales_forecast.pkl
│
├── notebooks/
│   ├── 01_EDA.ipynb
│   ├── 02_Preprocessing.ipynb
│   ├── 03_Baseline_Forecasting.ipynb
│   ├── 04_Customer_Segmentation.ipynb
│   ├── 05_Churn_Prediction.ipynb
│   ├── 06_Product_Recommendation.ipynb
│   └── 07_Anomaly_Detection.ipynb
│
├── utils/
│
└── README.md
```

---

# Dataset

**Source:** Kaggle Retail Transaction Dataset

**Records:** 100,000

### Features

- CustomerID
- ProductID
- Quantity
- Price
- TransactionDate
- PaymentMethod
- StoreLocation
- ProductCategory
- DiscountApplied (%)
- TotalAmount

---

# Milestone 2 Achievements

## 1. Sales Forecasting

Developed a baseline sales forecasting model using **Facebook Prophet**.

### Output

- Daily sales forecast
- Prophet trained model

### API

| Method | Endpoint |
|---------|----------|
| GET | / |
| POST | /forecast |

---

## 2. Customer Segmentation

Segmented customers based on purchasing behaviour.

### Output File

```
customer_segmentation.csv
```

### API

| Method | Endpoint |
|---------|----------|
| GET | /customer/<customer_id> |

Returns:

- CustomerID
- CustomerGroup

---

## 3. Customer Churn Prediction

Implemented rule-based churn detection using customer inactivity.

### Logic

```
InactiveDays > 60
        ↓
At Risk
```

Otherwise:

```
Not At Risk
```

### Output File

```
customer_churn.csv
```

### API

| Method | Endpoint |
|---------|----------|
| GET | /customer/<customer_id> |

Returns:

- CustomerID
- ChurnRisk

---

## 4. Product Recommendation

Implemented a purchase-frequency based recommendation engine.

### Output File

```
product_recommendations.csv
```

### API

| Method | Endpoint |
|---------|----------|
| GET | /recommend/<product_id> |

Returns:

- ProductID
- Top 3 Recommended Products

---

## 5. Anomaly Detection

Implemented statistical anomaly detection using the **3σ (Three Sigma) Rule** on transaction amount.

### Logic

```
Mean ± 3 × Standard Deviation
```

Transactions outside the threshold are classified as anomalies.

### Output File

```
anomaly_detection.csv
```

### API

| Method | Endpoint |
|---------|----------|
| GET | /customer/<customer_id> |

Returns:

- CustomerID
- TotalAmount
- Anomaly Status

---

# APIs Developed

| API | Framework |
|------|-----------|
| Forecast API | FastAPI |
| Customer Segmentation API | Flask |
| Churn Prediction API | Flask |
| Product Recommendation API | Flask |
| Anomaly Detection API | Flask |

---

# Technologies Used

- Python
- Pandas
- NumPy
- Prophet
- Scikit-learn
- Flask
- FastAPI
- Joblib
- Matplotlib
- Jupyter Notebook

---

# Deliverables

### Datasets

- preprocessed_data.csv
- customer_segmentation.csv
- customer_churn.csv
- product_recommendations.csv
- anomaly_detection.csv

### Model

- prophet_sales_forecast.pkl

### APIs

- Forecast API
- Customer Segmentation API
- Churn Prediction API
- Product Recommendation API
- Anomaly Detection API

---

# Module Status

## Milestone 2

✅ Data Preprocessing Completed

✅ Sales Forecasting Completed

✅ Customer Segmentation Completed

✅ Churn Prediction Completed

✅ Product Recommendation Completed

✅ Anomaly Detection Completed

✅ Five REST APIs Developed

✅ Backend Integration Ready

---

# Project

**MarketMind AI – Small Business Sales Intelligence Platform**

**Module:** Artificial Intelligence & Machine Learning

**Status:** Milestone 2 Completed ✅