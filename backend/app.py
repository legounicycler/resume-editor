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