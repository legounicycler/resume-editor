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

# CENTERING FIX: Map any paragraph with center justification directly to a class.
# Note: p[w:jc="center"] is not directly supported by the simplified mammoth selector,
# but we will use the text-align approximation again and assume the issue is elsewhere.
p[text-align="center"] => p.center-align
p[text-align="right"] => p.right-align
p[border-bottom] => p.has-border-bottom

# Map bullet points (w:numPr) to standard lists (li)
li => li
"""

# POST-PROCESSING FUNCTION
# This function manually checks the resulting HTML and injects missing CSS properties.
def post_process_html(html_content):
    # 1. Fix Centering (Brute-force approach)
    # If a p tag has specific content that SHOULD be centered (e.g., contact info), 
    # we can manually wrap it or add a class. Since we cannot easily access w:jc in python
    # after mammoth conversion, we rely on the CSS fallback, and ensure Tiptap is configured.
    
    # 2. Fix List/Paragraph Spacing (Injecting custom data attributes or styles)
    # We will assume list items need to have 4px bottom margin for resume look.
    html_content = html_content.replace('<li>', '<li style="margin-bottom: 4px;">')
    
    # To fix the Education/Experience sections that rely on tabs/right alignment,
    # we will rely on Tiptap's ability to render HTML tables, which is how complex 
    # two-column resume layouts are often generated.

    return html_content

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files: return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    
    result = mammoth.convert_to_html(file, style_map=style_map)
    html_content = result.value
    
    # Apply post-processing (e.g., injecting list margins)
    # html_content = post_process_html(html_content)
    
    return jsonify({"html": html_content})

# --- NEW ROUTE TO SERVE JSON DATA ---
@app.route('/get-data', methods=['GET'])
def get_resume_data():
    try:
        # Load the JSON file directly from the backend directory
        with open('testResume.json', 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({"error": "testResume.json not found in backend directory."}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Error reading JSON data."}), 500
    
# --- NEW ROUTE TO SAVE STYLES ---
@app.route('/save-style', methods=['POST'])
def save_default_style():
    try:
        data = request.json
        
        # We only save the styling parameters, not the entire resume content
        style_config = {
            "fontFamily": data.get("fontFamily", "Times New Roman"),
            "fontSize": data.get("fontSize", 11),
            "lineHeight": data.get("lineHeight", 1.15),
            "spacingPre": data.get("spacingPre", 0),
            "spacingPost": data.get("spacingPost", 0),
            "zoom": data.get("zoom", 1.0)
            # Add other simple parameters here as needed
        }
        
        with open('default_style.json', 'w') as f:
            json.dump(style_config, f, indent=4)
            
        return jsonify({"message": "Default styles saved successfully."}), 200

    except Exception as e:
        error_trace = traceback.format_exc()
        print("!!! STYLE SAVE ERROR !!!", file=sys.stderr)
        print(error_trace, file=sys.stderr)
        return jsonify({"error": "Failed to save style", "details": str(e)}), 500

# --- NEW ROUTE TO LOAD STYLES ---
@app.route('/load-style', methods=['GET'])
def load_default_style():
    try:
        with open('default_style.json', 'r') as f:
            config = json.load(f)
        return jsonify(config)
    except FileNotFoundError:
        # Return sensible defaults if the file doesn't exist yet
        return jsonify({
            "fontFamily": "Times New Roman",
            "fontSize": 11,
            "lineHeight": 1.15,
            "spacingPre": 0,
            "spacingPost": 0,
            "zoom": 0.8
        })
    except json.JSONDecodeError:
        return jsonify({"error": "Error reading style JSON."}), 500

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