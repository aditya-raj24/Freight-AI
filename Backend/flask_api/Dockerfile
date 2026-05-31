FROM python:3.10-slim

WORKDIR /usr/src/app/flask_api

# Install requirements
COPY Backend/flask_api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy files and position the pickled model relative to app.py
COPY Backend/flask_api/ .
COPY freight_model.pkl /usr/src/freight_model.pkl

EXPOSE 5000

CMD ["python", "app.py"]
