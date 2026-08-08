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

**Status:** Milestone 2 Completed

---

# Milestone 3

## Day 1 – AI Enhancement Planning

Milestone 3 Day 1 focused on reviewing the existing AI modules developed in Milestone 1 and Milestone 2 and preparing the implementation plan for the upcoming enhancements.

### Activities Completed

- Reviewed the baseline Sales Forecasting implementation.
- Reviewed the existing Customer Segmentation module.
- Reviewed the existing Customer Churn Prediction module.
- Reviewed the existing Product Recommendation module.
- Reviewed the existing Anomaly Detection module.
- Prepared enhancement plans for all five AI components.
- Confirmed reuse of the existing Retail Transaction Dataset for all future improvements.
- Confirmed that no new dataset will be collected or introduced during Milestone 3.

### Existing AI Modules Reviewed

| Module | Current Implementation |
|---------|------------------------|
| Sales Forecasting | Facebook Prophet (Baseline) |
| Customer Segmentation | K-Means Clustering |
| Churn Prediction | Rule-Based Customer Inactivity |
| Product Recommendation | Purchase Frequency Based Recommendation |
| Anomaly Detection | Statistical 3σ Rule |

### Planned Milestone 3 Enhancements

- Improve forecasting model performance while maintaining compatibility with the existing API.
- Improve customer segmentation accuracy using the existing dataset.
- Refine churn prediction to improve identification of at-risk customers.
- Enhance product recommendation quality using the existing transaction data.
- Improve anomaly detection accuracy while preserving the current integration.

### Dataset Confirmation

- Existing Retail Transaction Dataset will continue to be used.
- Existing preprocessing pipeline will be reused.
- No additional dataset collection is planned for Milestone 3.

### Day 1 Status

✅ Existing AI modules reviewed
✅ Milestone 3 enhancement plan prepared
✅ Dataset reuse confirmed
✅ Day 1 planning completed

## Day 2 – Improved Sales Forecasting

Implemented an improved sales forecasting model using **Random Forest Regressor** on the existing historical sales dataset while preserving the baseline Prophet model for future comparison.

### Achievements

- Trained Random Forest forecasting model
- Reused existing preprocessed dataset
- Model evaluated using MAE and RMSE
- Saved model as `improved_sales_forecast.pkl`

### Performance

| Metric | Value |
|---------|------:|
| MAE | 1.53 |
| RMSE | 5.91 |

### Status

✅ Improved forecasting model trained
✅ Model saved successfully

## Day 3 – Forecast Model Comparison

Compared the baseline Prophet model with the improved Random Forest model using the same dataset and evaluation metrics.

| Model | MAE | RMSE | R2 SCORE |
|------|----:|-----:|
| Prophet | 807.52 | 944.37 ||
| Random Forest | 1.53 | 5.91 |0.9992|

**Status**

✅ Model comparison completed
✅ Random Forest selected as the preferred forecasting model

---

## Milestone 3 - Day 5 (Customer Segmentation Improvement)

### Improvements over Milestone 2

| Milestone 2 | Milestone 3 |
|--------------|-------------|
| Used only Total Spent, Quantity Purchased and Purchase Frequency for customer segmentation. | Added Average Order Value, Average Quantity Per Transaction and Recency for richer customer profiling. |
| Performed K-Means clustering without validating cluster quality. | Evaluated clustering using Silhouette Score, Calinski-Harabasz Score and Davies-Bouldin Index. |
| No justification for the selected number of clusters. | Used the Elbow Method to validate the choice of 3 clusters. |
| Generated only the baseline customer segmentation dataset. | Generated an improved customer segmentation dataset while preserving the original Milestone 2 output. |

### Model Evaluation

- Number of Clusters: **3**
- Silhouette Score: **0.3976**
- Calinski-Harabasz Score: **59461.03**
- Davies-Bouldin Index: **0.9238**

### Output
- `improved_customer_segmentation.csv`


### Day 7 – Recommendation Engine Improvement

The Milestone 2 recommendation engine used a popularity-based approach, recommending products based on their overall purchase frequency.

For Milestone 3, the recommendation logic was improved using customer-level co-purchase behavior. Products purchased by the same customer were grouped into product pairs, and the frequency of each pair was calculated.

#### Improvement

- Baseline: Global product popularity
- Improved: Customer-level co-purchase frequency
- Co-purchase support was calculated for product associations.
- The same products were tested using both recommendation approaches.
- No new dataset was introduced; the existing seeded dataset was reused.

#### Validation Results

| Metric | Milestone 2 Baseline | Milestone 3 Improved |
|---|---:|---:|
| Average Top-1 Co-Purchase | 591.5 | 633.0 |
| Relative Improvement | - | 7.02% |

The improved recommendation engine increased the average co-purchase strength of the top-ranked recommendation from **591.5 to 633.0**, representing a **7.02% improvement**.

Because the dataset contains only four products and does not contain ground-truth recommendation labels, conventional classification metrics such as accuracy, precision, recall, and F1-score were not used. Co-purchase frequency and support were used as the validation measures instead.

#### Output Files

- `11_Improved_Product_Recommendation.ipynb`
- `improved_product_recommendations.csv`
- `improved_product_recommendations.pkl`