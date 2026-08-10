from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import onnxruntime as ort
import xgboost as xgb
import joblib
import pandas as pd
import numpy as np
from PIL import Image
import io
import os

app = FastAPI(title="CerviGuard Edge Inference API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models
clinical_model = None
clinical_imputer = None
clinical_scaler = None
clinical_features = None
vision_session = None

def load_models():
    global clinical_model, clinical_imputer, clinical_scaler, clinical_features, vision_session
    try:
        # Load Tabular Model
        model_dir = os.path.join(os.path.dirname(__file__), '../models/trained')
        clinical_model = xgb.XGBClassifier()
        clinical_model.load_model(os.path.join(model_dir, 'clinical_xgb.json'))
        clinical_imputer = joblib.load(os.path.join(model_dir, 'clinical_imputer.joblib'))
        clinical_scaler = joblib.load(os.path.join(model_dir, 'clinical_scaler.joblib'))
        clinical_features = joblib.load(os.path.join(model_dir, 'clinical_features.joblib'))
        print("Tabular model loaded successfully.")
    except Exception as e:
        print(f"Warning: Could not load clinical model. Run train_clinical.py first. Error: {e}")

    try:
        # Load Vision Model
        onnx_path = os.path.join(os.path.dirname(__file__), '../models/trained/cerviguard_mobilevit_sipakmed.onnx')
        vision_session = ort.InferenceSession(onnx_path, providers=['CPUExecutionProvider'])
        print("Vision model (ONNX) loaded successfully.")
    except Exception as e:
        print(f"Warning: Could not load vision model. Run train_vision.py first. Error: {e}")

load_models()

@app.get("/health")
def health_check():
    return {"status": "ready", "models_loaded": {
        "clinical": clinical_model is not None,
        "vision": vision_session is not None
    }}

@app.post("/predict/clinical")
async def predict_clinical(
    age: int = Form(...),
    smoking: str = Form(...),
    hormonal_contraceptives: bool = Form(...),
    hormonal_years: float = Form(...),
    iud: bool = Form(...),
    iud_years: float = Form(...),
    std_history: bool = Form(...),
    pregnancies: int = Form(...)
):
    if clinical_model is None:
        raise HTTPException(status_code=500, detail="Clinical model not loaded on server.")
        
    try:
        # Map frontend inputs to model features
        input_dict = {
            'Age': [age],
            'Number of sexual partners': [1], # default or impute
            'First sexual intercourse': [18],
            'Num of pregnancies': [pregnancies],
            'Smokes': [1 if smoking != 'never' else 0],
            'Smokes (years)': [5 if smoking != 'never' else 0],
            'Smokes (packs/year)': [0.5 if smoking != 'never' else 0],
            'Hormonal Contraceptives': [1 if hormonal_contraceptives else 0],
            'Hormonal Contraceptives (years)': [hormonal_years],
            'IUD': [1 if iud else 0],
            'IUD (years)': [iud_years],
            'STDs': [1 if std_history else 0],
            'STDs (number)': [1 if std_history else 0],
            'STDs:condylomatosis': [0],
            'STDs:cervical condylomatosis': [0],
            'STDs:vaginal condylomatosis': [0],
            'STDs:vulvo-perineal condylomatosis': [0],
            'STDs:syphilis': [0],
            'STDs:pelvic inflammatory disease': [0],
            'STDs:genital herpes': [0],
            'STDs:molluscum contagiosum': [0],
            'STDs:AIDS': [0],
            'STDs:HIV': [0],
            'STDs:Hepatitis B': [0],
            'STDs:HPV': [0],
            'STDs: Number of diagnosis': [0],
            'Dx:Cancer': [0],
            'Dx:CIN': [0],
            'Dx:HPV': [0],
            'Dx': [0],
            'Hinselmann': [0],
            'Schiller': [0],
            'Citology': [0]
        }
        
        # Only keep features the model expects
        df = pd.DataFrame(input_dict)
        df = df[clinical_features] # Ensure correct order
        
        # Scale
        cols_to_scale = ['Age', 'Num of pregnancies', 'Hormonal Contraceptives (years)', 'IUD (years)']
        cols_to_scale = [c for c in cols_to_scale if c in df.columns]
        df[cols_to_scale] = clinical_scaler.transform(df[cols_to_scale])
        
        # Predict
        prob = clinical_model.predict_proba(df)[0][1] # Probability of Class 1 (Biopsy Positive)
        
        return {"risk_score": float(prob)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/vision")
async def predict_vision(file: UploadFile = File(...)):
    if vision_session is None:
        raise HTTPException(status_code=500, detail="Vision model not loaded on server.")
        
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
        
        # Preprocess Image (Match torchvision transforms)
        image = image.resize((256, 256))
        img_array = np.array(image).astype(np.float32) / 255.0
        
        # Normalize
        mean = np.array([0.485, 0.456, 0.406])
        std = np.array([0.229, 0.224, 0.225])
        img_array = (img_array - mean) / std
        
        # HWC to CHW
        img_array = np.transpose(img_array, (2, 0, 1))
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        # Inference
        input_name = vision_session.get_inputs()[0].name
        logits = vision_session.run(None, {input_name: img_array})[0][0]
        
        # Softmax
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / exp_logits.sum()
        
        classes = ['Dyskeratotic', 'Koilocytotic', 'Metaplastic', 'Parabasal', 'Superficial-Intermediate']
        
        results = {classes[i]: float(probs[i]) for i in range(len(classes))}
        top_class = classes[np.argmax(probs)]
        
        return {
            "top_class": top_class,
            "confidence": float(np.max(probs)),
            "distribution": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
