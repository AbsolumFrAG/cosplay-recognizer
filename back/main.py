from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import io
from PIL import Image
import numpy as np
from model import ModernCosplayClassifier
from keras.api.models import load_model

app = FastAPI(title="API Moderne de Classification de Cosplay")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = ModernCosplayClassifier()
classifier.model = load_model('modern_model.keras')
classifier.class_names = np.load('class_names.npy').tolist()

@app.post("/predict")
async def predict_character(file: UploadFile = File(...)):
    image_data = await file.read()
    img = Image.open(io.BytesIO(image_data))
    predictions = classifier.predict(img)
    return predictions