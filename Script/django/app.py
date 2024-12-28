from flask import Flask, render_template, request
import google.generativeai as genai
from PyPDF2 import PdfReader
from io import BytesIO

app = Flask(__name__)

# Directly set your API key here
GOOGLE_API_KEY = "AIzaSyAKih8hHjOfJJVkvVcXtC1EAF_P7ye7N1E"

# Configure Google API key for Gemini
genai.configure(api_key=GOOGLE_API_KEY)

# Function to extract text from PDF
def extract_text_from_pdf(pdf_file):
    try:
        pdf_reader = PdfReader(pdf_file)
        text = "".join(page.extract_text() for page in pdf_reader.pages)
        return text
    except Exception as e:
        return f"An error occurred while reading the PDF: {str(e)}"

# Function to generate ATS score and feedback
def generate_ats_score(resume_text, job_description):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
        Compare the following resume with the job description provided below and generate an ATS score out of 100. Provide detailed feedback on how the resume aligns with the job description and suggest improvements.

        Resume:
        {resume_text}

        Job Description:
        {job_description}

        Output the score and feedback in a structured format.
        """
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"An error occurred while generating the ATS score and feedback: {str(e)}"

# Function to extract score from feedback
def extract_score_from_feedback(feedback):
    try:
        score_line = [line for line in feedback.splitlines() if "Score:" in line]
        if score_line:
            return int(score_line[0].split(":")[-1].strip().split("/")[0])
        return None
    except Exception as e:
        return None

# Function to create a simple ASCII speedometer representation
def create_speedometer(score):
    # Simplified ASCII speedometer for terminal output
    meter = ["[", ".", ".", ".", ".", ".", ".", ".", ".", "]"]
    position = int(score / 10)
    meter[position] = "O"  # Mark the position of the score
    return "".join(meter)

# Function to suggest courses based on feedback
def suggest_courses(feedback):
    # Example suggestions based on keywords in feedback
    suggestions = {
        "Python": {
            "Free": [
                {"name": "Python for Everybody", "link": "https://www.coursera.org/specializations/python"},
                {"name": "Automate the Boring Stuff with Python", "link": "https://automatetheboringstuff.com/"}
            ],
            "Paid": [
                {"name": "Complete Python Bootcamp", "link": "https://www.udemy.com/course/complete-python-bootcamp/"},
                {"name": "Python Programming Masterclass", "link": "https://www.udemy.com/course/python-the-complete-python-developer-course/"}
            ]
        },
        "Data Analysis": {
            "Free": [
                {"name": "Introduction to Data Analysis", "link": "https://www.edx.org/course/introduction-to-data-analysis"},
                {"name": "Data Analysis with Python", "link": "https://www.freecodecamp.org/learn/"}
            ],
            "Paid": [
                {"name": "Data Analyst Nanodegree", "link": "https://www.udacity.com/course/data-analyst-nanodegree--nd002"},
                {"name": "Excel to MySQL: Data Analysis", "link": "https://www.coursera.org/specializations/excel-mysql" }
            ]
        }
    }

    # Extract relevant suggestions based on feedback content
    matched_suggestions = {}
    for skill, courses in suggestions.items():
        if skill.lower() in feedback.lower():
            matched_suggestions[skill] = courses

    return matched_suggestions

@app.route('/', methods=['GET', 'POST'])
def index():
    ats_score = None
    ats_feedback = None
    speedometer = None
    course_suggestions = None

    if request.method == 'POST':
        # Get the uploaded files from the form
        resume_file = request.files['resume']
        job_description_file = request.files['job_description']
        
        # Extract text from the uploaded PDFs
        resume_text = extract_text_from_pdf(resume_file)
        job_description_text = extract_text_from_pdf(job_description_file)
        
        if "An error occurred" in resume_text or "An error occurred" in job_description_text:
            return render_template('ats.html', error="Error reading one or both PDFs.")
        
        # Generate ATS score and feedback
        ats_feedback = generate_ats_score(resume_text, job_description_text)

        if "An error occurred" in ats_feedback:
            return render_template('ats.html', error="Error generating ATS score.")
        
        # Extract score from the feedback
        ats_score = extract_score_from_feedback(ats_feedback)
        
        if ats_score is not None:
            # Create a speedometer representation for the ATS score
            speedometer = create_speedometer(ats_score)
            # Suggest courses based on feedback
            course_suggestions = suggest_courses(ats_feedback)

    return render_template('ats.html', ats_score=ats_score, ats_feedback=ats_feedback, 
                           speedometer=speedometer, course_suggestions=course_suggestions)

if __name__ == '__main__':
    app.run(debug=True)
