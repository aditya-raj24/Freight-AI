import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ==============================
# LOAD MODEL
# ==============================
model_path_local = os.path.abspath(os.path.join(os.path.dirname(__file__), 'freight_model.pkl'))
model_path_parent = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../freight_model.pkl'))

model = None
for path in [model_path_local, model_path_parent]:
    if os.path.exists(path):
        try:
            model = joblib.load(path)
            print(f"Model loaded successfully from: {path}")
            break
        except Exception as e:
            print(f"Failed to load model from {path}: {e}")


# ==============================
# ROOT CORRIDOR / LANDING
# ==============================
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "Active",
        "service": "FreightLink AI ML Prediction Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health [GET]",
            "predict": "/predict [POST]"
        }
    })


# ==============================
# HEALTH CHECK
# ==============================
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "Flask ML API running"})


# ==============================
# PREDICTION ENDPOINT
# ==============================
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json

        # ==============================
        # VALIDATION
        # ==============================
        required_fields = [
            "distance", "wagon_count", "total_weight",
            "locomotive_power", "congestion_level",
            "rainfall", "avg_wait_time"
        ]

        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({"error": f"{field} is required"}), 400

        # ==============================
        # CREATE INPUT DATAFRAME
        # ==============================
        input_df = pd.DataFrame([{
            "distance": data["distance"],
            "wagon_count": data["wagon_count"],
            "total_weight": data["total_weight"],
            "locomotive_power": data["locomotive_power"],
            "congestion_level": data["congestion_level"],
            "rainfall": data["rainfall"],
            "avg_wait_time": data["avg_wait_time"]
        }])

        # ==============================
        # PREDICTION
        # ==============================
        if model:
            prediction = model.predict(input_df)[0]
            delay = float(prediction)
        else:
            # fallback logic
            delay = 20.0
            if data["congestion_level"] > 80:
                delay += 20
            if data["rainfall"] > 15:
                delay += 10

        return jsonify({
            "delay": round(delay, 2)
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": f"Prediction failed: {str(e)}"
        }), 500


# ==============================
# RUN SERVER
# ==============================
if __name__ == '__main__':
    # Bind to 0.0.0.0 and read PORT from environment for cloud deployment
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)