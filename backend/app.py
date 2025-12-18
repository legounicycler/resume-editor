import os
import mammoth
from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
from dotenv import load_dotenv
import json
import traceback
import sys
import base64

# List the icon names we expect to load (must match your JSON fields)
EXPECTED_ICON_NAMES = ['email', 'phone', 'linkedin', 'website']

def load_image_icons(icon_names):
    """
    Reads image files (assumed to be in PNG format) from the 'assets' directory
    and encodes them as Base64 Data URIs.
    """
    icon_data = {}
    icon_dir = os.path.join(os.path.dirname(__file__), '..\\frontend\\src\\assets')

    # Ensure the directory exists
    if not os.path.exists(icon_dir):
        print(f"!!! WARNING: Image icon directory '{icon_dir}' not found. Icons will be empty.")
        return {}

    # Iterate through expected icon names to load corresponding files
    for name in icon_names:
        filename = f"{name}.png"
        filepath = os.path.join(icon_dir, filename)

        if os.path.exists(filepath):
            try:
                with open(filepath, 'rb') as f:
                    # Read binary data
                    binary_data = f.read()

                    # Encode to Base64 and create a Data URI string
                    base64_encoded = base64.b64encode(binary_data).decode('utf-8')
                    data_uri = f"data:image/png;base64,{base64_encoded}"

                    icon_data[name] = data_uri
            except Exception as e:
                print(f"Error reading image file {filename}: {e}")
        else:
            print(f"Image file not found: {filepath}")

    print(f"Loaded icons: {list(icon_data.keys())}")
    return icon_data

# Global variable to store loaded icons (Data URIs)
LOADED_ICONS = load_image_icons(EXPECTED_ICON_NAMES)

load_dotenv()
app = Flask(__name__)
CORS(app)
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# ADVANCED STYLE MAP
# This attempts to catch standard resume formatting tricks.
style_map = """
u => u
b => strong
i => em
strike => del
highlight => mark
"""

@app.route('/get-icons-png', methods=['GET'])
def get_icons_png():
    """Returns the dictionary of icon names mapped to their Base64 Data URI strings."""
    return jsonify(LOADED_ICONS)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files: return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']

    result = mammoth.convert_to_html(file, style_map=style_map)
    html_content = result.value

    return jsonify({"html": html_content})

# --- NEW ROUTE TO SERVE JSON DATA ---
@app.route('/get-data', methods=['GET'])
def get_resume_data():
    try:
        # Load the JSON file directly from the backend directory
        with open('./resumes/SoftwareResume.json', 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({"error": "MechanicalResume.json not found in backend directory."}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Error reading JSON data."}), 500

@app.route('/analyze', methods=['POST'])
def analyze_resume():
    try:
        data = request.json
        resume_html = data.get('resumeHtml')
        job_description = data.get('jobDescription')

        if not resume_html or not job_description:
            return jsonify({"error": "Missing resume or JD"}), 400

        # Updated Model ID to gemini-2.5-flash
        prompt = f"""
        You are an expert Resume Editor.
        Task: Rewrite the provided Resume HTML to better match the Job Description.

        CRITICAL OUTPUT RULES:
        1. Return ONLY valid JSON.
        2. The JSON must have two keys: "html" and "mappings".
        3. In the "html" string:
           - Use the exact same HTML structure as input.
           - Wrap ANY text you add/change in: <mark data-type="ai-edit" data-reason="YOUR_REASONING">new text</mark>
        4. In the "mappings" array:
           - Return pairs: {{"jd_phrase": "text", "resume_phrase": "text"}}

        RESUME HTML:
        {resume_html}

        JOB DESCRIPTION:
        {job_description}
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        clean_text = response.text.replace('```json', '').replace('```', '').strip()
        ai_data = json.loads(clean_text)
        return jsonify(ai_data)

    except Exception as e:
        # 1. Capture the full stack trace
        error_trace = traceback.format_exc()

        # 2. Print to Terminal (Standard Error) so you can see it
        print("!!! BACKEND ERROR !!!", file=sys.stderr)
        print(error_trace, file=sys.stderr)

        # 3. Send trace to Frontend
        return jsonify({
            "error": "Server Error",
            "details": str(e),
            "stack": error_trace
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)