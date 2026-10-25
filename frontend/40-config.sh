#!/bin/sh
# יוצר את config.js בעת עליית הקונטיינר: אותה תמונה עובדת בכל סביבה (מקומי / ענן)
cat > /usr/share/nginx/html/config.js <<CFG
window.__CONFIG__ = { API_URL: "${API_URL:-http://localhost:8000}" };
CFG
