import os
import pandas as pd
import numpy as np
from ucimlrepo import fetch_ucirepo
from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import MinMaxScaler
from imblearn.over_sampling import SMOTE
import xgboost as xgb
import joblib

def main():
    print("Fetching UCI Cervical Cancer Dataset (ID 383)...")
    url = "https://archive.ics.uci.edu/ml/machine-learning-databases/00383/risk_factors_cervical_cancer.csv"
    df = pd.read_csv(url)
    
    X = df.drop(columns=['Biopsy', 'Hinselmann', 'Schiller', 'Citology', 'Dx:Cancer', 'Dx:CIN', 'Dx:HPV', 'Dx'])
    y = df['Biopsy']
    
    print("Preprocessing data...")
    # Convert '?' to NaN
    X = X.replace('?', np.nan)
    
    # Drop features with >80% missingness (e.g. STD timing fields)
    missing_pct = X.isnull().sum() / len(X)
    cols_to_drop = missing_pct[missing_pct > 0.8].index
    X = X.drop(columns=cols_to_drop)
    
    # Impute missing continuous variables with median
    imputer = SimpleImputer(strategy='median')
    X_imputed = pd.DataFrame(imputer.fit_transform(X), columns=X.columns)
    
    # Min-Max Scaling on specific features
    scaler = MinMaxScaler()
    cols_to_scale = ['Age', 'Num of pregnancies', 'Hormonal Contraceptives (years)', 'IUD (years)']
    cols_to_scale = [c for c in cols_to_scale if c in X_imputed.columns]
    X_imputed[cols_to_scale] = scaler.fit_transform(X_imputed[cols_to_scale])
    
    # SMOTE Oversampling
    print("Applying SMOTE for class imbalance...")
    smote = SMOTE(random_state=42)
    X_resampled, y_resampled = smote.fit_resample(X_imputed, y)
    
    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X_resampled, y_resampled, test_size=0.2, random_state=42)
    
    # Train XGBoost Model
    print("Training XGBoost Classifier...")
    model = xgb.XGBClassifier(
        objective='binary:logistic',
        eval_metric='logloss',
        use_label_encoder=False,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    acc = model.score(X_test, y_test)
    print(f"Model Test Accuracy (Resampled): {acc:.4f}")
    
    # Export artifacts
    os.makedirs('models/trained', exist_ok=True)
    model.save_model('models/trained/clinical_xgb.json')
    joblib.dump(imputer, 'models/trained/clinical_imputer.joblib')
    joblib.dump(scaler, 'models/trained/clinical_scaler.joblib')
    
    # Save feature names so backend knows expected input order
    joblib.dump(list(X_imputed.columns), 'models/trained/clinical_features.joblib')
    
    print("Saved XGBoost model and preprocessors to models/trained/")

if __name__ == '__main__':
    main()
