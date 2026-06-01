FROM python:3.10-slim

WORKDIR /usr/src/app/flask_api

# Install requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy files (includes app.py and the copied freight_model.pkl)
COPY . .

EXPOSE 7860

CMD ["python", "app.py"]
