# AIML Module - MarketMind AI

## Overview

The AIML module is responsible for data analysis, preprocessing, baseline sales forecasting, and exposing forecasting results through an API for integration with the backend and frontend components.

---

## Folder Structure

```
AIML/
│
├── api/
│   └── app.py
│
├── data/
│   ├── Retail_Transaction_Dataset.csv
│   └── preprocessed_data.csv
│
├── models/
│   └── prophet_sales_forecast.pkl
│
├── notebooks/
│   ├── 01_EDA.ipynb
│   ├── 02_Preprocessing.ipynb
│   └── 03_Baseline_Forecasting.ipynb
│
├── utils/
│
└── README.md
```

---

## Dataset

- Source: Kaggle Retail Transaction Dataset
- Records: 100,000
- Features :
  - CustomerID
  - ProductID
  - Quantity
  - Price
  - TransactionDate
  - PaymentMethod
  - StoreLocation
  - ProductCategory
  - DiscountApplied(%)
  - TotalAmount

---

## Completed Work

### 1. Exploratory Data Analysis (EDA)

- Dataset inspection
- Shape and data types
- Missing value analysis
- Duplicate record analysis
- Statistical summary
- Distribution visualizations

---

### 2. Data Preprocessing

- Converted TransactionDate to datetime format
- Encoded categorical variables
- Feature engineering
- Created cleaned dataset
- Saved preprocessed dataset

Output:

```
data/preprocessed_data.csv
```

---

### 3. Baseline Forecasting

Implemented a baseline sales forecasting model using Prophet.

Evaluation Metrics:

- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)

The model serves as the baseline for future model comparison.

Saved Model:

```
models/prophet_sales_forecast.pkl
```

---

### 4. API Integration

Developed a FastAPI service to expose the forecasting model.

Available Endpoints:

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | / | API Health Check |
| POST | /forecast | Returns forecast values |

The API returns responses in JSON format for backend integration.

---

## Technologies Used

- Python
- Pandas
- NumPy
- Matplotlib
- Scikit-learn
- Prophet
- FastAPI
- Joblib
- Jupyter Notebook

---

## Future Improvements

The following models are planned for future milestones:

- Random Forest Regressor
- XGBoost Regressor
- Hyperparameter Tuning
- Model Comparison
- Advanced Sales Forecasting
- API Enhancement

---

## Team

Project: **MarketMind AI**

Module: **Artificial Intelligence & Machine Learning**

Week 1 Status: **Completed**


## Customer Segmentation API

### Base URL

http://127.0.0.1:5000

---

### Endpoint

GET /customer/<customer_id>

---

### Description

Returns the customer segment for the given Customer ID.

---

### Example Request

GET /customer/87

---

### Example Response

{
    "CustomerID": 87,
    "CustomerGroup": "Occasional"
}

---

### Error Response

{
    "message": "Customer Not Found"
}

# Churn Prediction Module

## Objective

Identify customers who are likely to stop purchasing based on transaction inactivity.

---

## Method

A simple rule-based churn detection approach is used.

Rule:

- InactiveDays > 60 → At Risk
- Otherwise → Not At Risk

---

## Features Used

- CustomerID
- LastPurchaseDate
- TotalSpent
- TotalQuantity
- InactiveDays

---

## Output

Generated File:

data/customer_churn.csv

Output Columns:

- CustomerID
- LastPurchaseDate
- TotalSpent
- TotalQuantity
- InactiveDays
- ChurnRisk
