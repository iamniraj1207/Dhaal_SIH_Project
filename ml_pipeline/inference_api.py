import os
import onnxruntime as ort
import numpy as np
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

app = FastAPI(title="Dhaal Vision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "trained", "cerviguard_mobilevit_sipakmed.onnx")
CLASSES = ['Dyskeratotic', 'Koilocytotic', 'Metaplastic', 'Parabasal', 'Superficial-Intermediate']

session = None
if os.path.exists(MODEL_PATH):
    print(f"Loading ONNX model from {MODEL_PATH}...")
    try:
        providers = ['CPUExecutionProvider']
        session = ort.InferenceSession(MODEL_PATH, providers=providers)
        print(f"Model loaded successfully with providers: {session.get_providers()}")
    except Exception as e:
        print(f"Error loading model: {e}")
else:
    print(f"Warning: Model not found at {MODEL_PATH}")

def preprocess_image(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        image = image.resize((256, 256))
        img_arr = np.array(image).astype(np.float32) / 255.0
        
        # Normalize
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img_arr = (img_arr - mean) / std
        
        # HWC to CHW
        img_arr = np.transpose(img_arr, (2, 0, 1))
        # Add batch dimension
        img_arr = np.expand_dims(img_arr, axis=0)
        return img_arr
    except Exception as e:
        raise ValueError(f"Image preprocessing failed: {e}")

def softmax(x):
    e_x = np.exp(x - np.max(x, axis=1, keepdims=True))
    return e_x / e_x.sum(axis=1, keepdims=True)

@app.get("/")
async def health():
    return {"status": "ok", "model_loaded": session is not None}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    global session
    if not session:
        raise HTTPException(status_code=500, detail="Model not loaded")
        
    try:
        contents = await file.read()
        input_data = preprocess_image(contents)
        
        input_name = session.get_inputs()[0].name
        output_name = session.get_outputs()[0].name
        
        logits = session.run([output_name], {input_name: input_data})[0]
        probs = softmax(logits)[0]
        
        pred_class_idx = int(np.argmax(probs))
        pred_class = CLASSES[pred_class_idx]
        confidence = float(probs[pred_class_idx])
        
        return {
            "prediction": pred_class,
            "confidence": confidence,
            "all_scores": {CLASSES[i]: float(probs[i]) for i in range(len(CLASSES))}
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("inference_api:app", host="0.0.0.0", port=8000, reload=True)
