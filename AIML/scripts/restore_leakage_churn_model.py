import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import os

root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
data_path = os.path.join(root, 'data', 'improved_customer_churn.csv')
model_path = os.path.join(root, 'models', 'improved_customer_churn.pkl')

print('Loading leakage-labelled customer file:', data_path)
customer_df = pd.read_csv(data_path)

# Ensure expected columns
features = ['Recency', 'TotalTransactions', 'TotalSpent']
for c in features + ['Churn']:
    if c not in customer_df.columns:
        raise RuntimeError(f'Missing column {c} in {data_path}')

X = customer_df[features].fillna(0)
y = customer_df['Churn']

print('Feature Matrix :', X.shape)
print('Target Vector  :', y.shape)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

rf_model = RandomForestClassifier(n_estimators=300, max_depth=10, min_samples_split=5, min_samples_leaf=2, random_state=42, n_jobs=-1)
rf_model.fit(X_train, y_train)

# Eval
y_pred = rf_model.predict(X_test)
if hasattr(rf_model, 'predict_proba'):
    y_prob = rf_model.predict_proba(X_test)[:,1]
else:
    y_prob = rf_model.decision_function(X_test)

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, zero_division=0)
recall = recall_score(y_test, y_pred, zero_division=0)
f1 = f1_score(y_test, y_pred, zero_division=0)
roc = roc_auc_score(y_test, y_prob) if len(y_test.unique())>1 else float('nan')

print('='*60)
print('Retrained Leakage Random Forest Evaluation')
print('='*60)
print(f'Accuracy  : {accuracy:.4f}')
print(f'Precision : {precision:.4f}')
print(f'Recall    : {recall:.4f}')
print(f'F1 Score  : {f1:.4f}')
print(f'ROC-AUC   : {roc:.4f}')

joblib.dump(rf_model, model_path)
print('Saved leakage-model to', model_path)
