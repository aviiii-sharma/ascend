from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, JWTManager
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, url_for, jsonify
import os
import numpy as np
import pandas as pd
import joblib
from werkzeug.utils import secure_filename
from preprocess import preprocess_data # Assuming preprocess.py is still used for model input preparation
import google.generativeai as genai
import time
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId # For handling MongoDB _id fields
from textblob import TextBlob # Required for sentiment analysis in KPIs
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from bson.objectid import ObjectId
from bson.errors import InvalidId # Add this import for error handling 
from datetime import datetime

app = Flask(__name__)

load_dotenv() # Loads variables from your .env file

# DEPLOYMENT FIX: Secure CORS by using an environment variable for the origin.
# For local testing, your .env can have CORS_ORIGIN=http://localhost:5173
# On Render, you will set this to your Vercel frontend URL.
CORS(app, supports_credentials=True, resources={r"/*": {"origins": os.getenv("CORS_ORIGIN")}})

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
DEV_MODE = False

bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# Configuration for file uploads
UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- MongoDB Configuration (This part is already correct!) ---
# This code correctly uses the MONGO_URI from your environment variables,
# which you will set on Render to your Atlas connection string.
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = 'hr_data' 
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Collection variables
manager_users_collection = db['manager_users']
employees_collection = db['employees']
staging_collection = db['staging_employees']
tasks_collection = db['tasks']

# DEPLOYMENT FIX: CRITICAL SECURITY - Remove hardcoded API keys.
# Get your Gemini API key from an environment variable.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not set!")
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('models/gemini-1.5-flash')


# --- ALL YOUR ROUTES AND FUNCTIONS ---
# The logic inside your routes is great and doesn't need to be changed.
# I am including the full file here for completeness as you requested.

@app.route('/api/chatbot-query', methods=['POST'])
@jwt_required()
def chatbot_query():
    if DEV_MODE:
        print("\n🤖 CHATBOT IS IN DEV MODE: Returning a fake response. 🤖\n")
        return jsonify({'response': "This is a sample response from development mode. The real AI is not being called."})

    data = request.get_json()
    query = data.get('query', '').strip()
    if not query:
        return jsonify({'error': 'Empty query'}), 400

    emp_id = get_jwt_identity()
    if not emp_id:
        return jsonify({'error': 'Invalid authentication token.'}), 422

    employee = employees_collection.find_one({"employee_id": emp_id})
    if not employee:
        return jsonify({"error": f"Performance data for employee ID {emp_id} not found."}), 404

    employee_data = pd.DataFrame([employee])
    promo_input_cols = [col for col in promotion_features if col in employee_data.columns]
    attrition_input_cols = [col for col in attrition_features if col in employee_data.columns]

    promo_input = employee_data[promo_input_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
    attrition_input = employee_data[attrition_input_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
    
    for feature in promotion_features:
        if feature not in promo_input.columns: promo_input[feature] = 0
    for feature in attrition_features:
        if feature not in attrition_input.columns: attrition_input[feature] = 0

    promo_input = promo_input[promotion_features]
    attrition_input = attrition_input[attrition_features]
    
    promo_score = promotion_model.predict(promo_input)[0]
    attr_class = attrition_model.predict(attrition_input)[0]
    attr_label = label_encoder.inverse_transform([attr_class])[0]
    
    promotion_results = format_promotion_result(employee.get("name"), promo_score)
    attrition_results = format_attrition_result(employee.get("name"), attr_label)
    
    prompt = f"""
    You are EvalMate, an expert, empathetic AI HR assistant for an employee named {employee.get("name", "N/A")}.
    Your tone is professional, encouraging, and helpful.

    **YOUR TASK:**
    Analyze the user's query and the provided PERFORMANCE DATA to generate the most appropriate response based on the following rules.

    **RULES OF ENGAGEMENT:**
    1.  **If the user gives a simple greeting** (like "hi", "hello", "thanks"), respond with a polite, conversational greeting and ask how you can help. DO NOT provide any performance data unless asked.
        - Example: "Hello! I'm EvalMate. I'm here to help with questions about your performance evaluation. What can I assist you with today?"

    2.  **If the user asks for a general summary** (like "summarize my performance", "how am I doing?"), provide a brief, high-level overview of their Promotion Readiness and Attrition Risk.
        - Example: "Based on your latest evaluation, your promotion readiness is currently rated as '{promotion_results['level']}' and your attrition risk is considered '{attrition_results['risk_level']}'. Would you like to dive deeper into any specific area?"

    3.  **If the user asks a specific question about a metric, score, or topic** (e.g., "what is my promotion score?", "how can I improve my attrition risk?"), you MUST:
        a. Directly answer their question using the relevant information from the PERFORMANCE DATA.
        b. Provide 2-3 specific, actionable recommendations for improvement based on their data.
        c. Do NOT discuss other topics unless the user asks.

    4.  **If the user's query is unrelated** to their performance, promotion, or attrition, politely state that you cannot answer and guide them back to topics you can assist with.
        - Example: "I'm sorry, I can only assist with questions related to your performance data. You can ask me about your promotion readiness, attrition risk, or manager feedback."
        
    5. **General Formatting**: Never use raw database field names. Always use a conversational tone.

    **--- PERFORMANCE DATA FOR CONTEXT ---**
    - Employee Name: {employee.get("name", "N/A")}
    - Promotion Readiness Score: {promotion_results['score']}
    - Promotion Readiness Level: {promotion_results['level']}
    - Promotion Recommendation: {promotion_results['recommendation']}
    - Attrition Risk Level: {attrition_results['risk_level']}
    - Attrition Risk Recommendation: {attrition_results['recommendation']}
    - Manager's Comments Summary: "{employee.get("manager_comments", "No comments provided.")}"
    - Peer Review Summary: "{employee.get("peer_reviews", "No comments provided.")}"
    - Key KPI Scores (if available): {employee.get('kpi_scores', 'Not available')}

    **--- EMPLOYEE'S QUERY ---**
    "{query}"

    Now, generate the single, most appropriate response following all the rules above.
    """

    print("\n" + "="*50)
    print("PROMPT BEING SENT TO GEMINI AI:")
    print("="*50)
    print(prompt)
    print("="*50 + "\n")

    try:
        response = gemini_model.generate_content(prompt)
        return jsonify({'response': response.text.strip()})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ... Paste the rest of your routes here, they do not need modification for deployment ...
# (generate_report_from_dashboard, assign_task, update_task_status, etc.)
# ... The rest of your file from line 144 onwards is included below without changes ...
@app.route('/api/generate-report', methods=['POST'])
@jwt_required()
def generate_report_from_dashboard():
    """
    Generates a full evaluation report for an employee from the main 'employees' collection,
    with added permission checks.
    """
    try:
        # --- PERMISSION CHECK LOGIC ---
        claims = get_jwt()
        user_role = claims.get('role')
        current_user_id = get_jwt_identity()
        
        employee_name = request.form.get('employee_name')
        if not employee_name:
            return jsonify({'error': 'Employee name is required'}), 400

        target_employee = employees_collection.find_one({'name': employee_name})
        if not target_employee:
            return jsonify({'error': f"Employee '{employee_name}' not found in the database."}), 404

        has_permission = False
        # Rule 1: HR users can access any report.
        if user_role == 'HR':
            has_permission = True
            print(f"✅ Access granted for HR user.")

        if user_role == 'Manager':
            has_permission = True
            print(f"✅ Access granted for Manager user.")

        # Rule 2: Managers can access reports for their direct reports.
        if not has_permission and user_role == 'Manager':
            manager_doc = db.manager_users.find_one({'employee_id': current_user_id}, {'name': 1})
            
            # --- START: ROBUST CHECK & DEBUGGING ---
            if manager_doc:
                manager_name = manager_doc.get('name', '').strip()
                employee_reporting_to = target_employee.get('reporting_manager', '').strip()

                # Print values to the terminal for debugging
                print("-" * 50)
                print(f"Attempting Manager access check:")
                print(f"  - Logged-in Manager: '{manager_name}' (ID: {current_user_id})")
                print(f"  - Target Employee: '{employee_name}'")
                print(f"  - Employee reports to: '{employee_reporting_to}'")
                
                if manager_name and employee_reporting_to and manager_name == employee_reporting_to:
                    has_permission = True
                    print(f"✅ Access GRANTED. Manager name matches employee's reporting manager.")
                else:
                    print(f"❌ Access DENIED. Manager name does not match.")
                print("-" * 50)
            else:
                 print(f"❌ Access DENIED. Could not find manager document for ID: {current_user_id}")
            # --- END: ROBUST CHECK & DEBUGGING ---

        if not has_permission:
            # This is the line that is likely being triggered for your managers
            return jsonify({'error': 'Forbidden: You do not have permission to generate this report.'}), 403

        # If permission is granted, the original logic continues...
        employee_data_dict = target_employee
        employee_data = pd.DataFrame([employee_data_dict])
        
        # ... (the rest of the function remains the same) ...
        # Prepare inputs for all models
        promo_input_cols = [col for col in promotion_features if col in employee_data.columns]
        attrition_input_cols = [col for col in attrition_features if col in employee_data.columns]
        anomaly_input_cols = [col for col in anomaly_features if col in employee_data.columns]

        promo_input = employee_data[promo_input_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
        attrition_input = employee_data[attrition_input_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
        anomaly_input = employee_data[anomaly_input_cols].apply(pd.to_numeric, errors='coerce').fillna(0)

        # Ensure all feature columns exist
        for feature in promotion_features:
            if feature not in promo_input.columns: promo_input[feature] = 0
        for feature in attrition_features:
            if feature not in attrition_input.columns: attrition_input[feature] = 0
        for feature in anomaly_features:
            if feature not in anomaly_input.columns: anomaly_input[feature] = 0
        
        promo_input = promo_input[promotion_features]
        attrition_input = attrition_input[attrition_features]
        anomaly_input = anomaly_input[anomaly_features]

        # Run the models
        flags, scores, reasons = anomaly_model.predict_with_reason(anomaly_input)
        promo_score = promotion_model.predict(promo_input)[0]
        attr_class = attrition_model.predict(attrition_input)[0]
        attr_label = label_encoder.inverse_transform([attr_class])[0]
        anomaly_score = scores[0]
        reason = reasons[0]

        # Summarize feedback with Gemini
        feedback_text = "\n".join([
            f"{col.replace('_', ' ').title()}: {employee_data_dict.get(col, '')}"
            for col in ['manager_comments', 'hr_notes', 'peer_reviews', 'client_feedback']
            if employee_data_dict.get(col) and str(employee_data_dict.get(col)).strip()
        ])
        feedback_summary = summarize_feedback_gemini(feedback_text) if feedback_text.strip() else "No feedback provided."

        # Format the final results
        promo_result = format_promotion_result(employee_name, promo_score)
        promo_result.update({
            'employee_id': employee_data_dict.get('employee_id'),
            'department': employee_data_dict.get('department'),
            'role': employee_data_dict.get('designation')
        })

        kpi_scores = {
            'Leadership': employee_data_dict.get('leadership_score'),
            'Integrity Feedback': employee_data_dict.get('integrity_feedback_score'),
            'Collaboration & Communication': employee_data_dict.get('collaboration_communication_score'),
            'Adaptability & Growth': employee_data_dict.get('adaptability_growth_score'),
            'Skill Development': employee_data_dict.get('skill_development_score'),
            'Effort & Engagement': employee_data_dict.get('effort_engagement_score')
        }
# Add the scores to the promotion result, ensuring no empty values are included
        promo_result['kpi_scores'] = {k: v for k, v in kpi_scores.items() if v is not None}
# --- END OF FIX ---

        result_data = {
            'promotion': promo_result,
            'attrition': format_attrition_result(employee_name, attr_label),
            'anomaly': format_anomaly_result(anomaly_score, reason),
            'feedback_summary': feedback_summary
        }

        return jsonify(result_data), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"An error occurred during prediction: {str(e)}"}), 500

@app.route('/api/manager/assign-task', methods=['POST'])
@jwt_required()
def assign_task():
    """
    Assigns a task to a specific employee or broadcasts it to the entire team.
    """
    try:
        data = request.get_json()
        manager_emp_id = get_jwt_identity()

        # --- Validation ---
        required_fields = ['task_title', 'task_description', 'due_date', 'priority']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required task fields'}), 400

        # --- Get Manager Info ---
        manager = manager_users_collection.find_one({'employee_id': manager_emp_id})
        if not manager:
            return jsonify({'error': 'Manager not found or you do not have permission'}), 403
        
        manager_id_obj = manager['_id'] # The ObjectId of the manager
        manager_name = manager['name']

        # --- Prepare Task Document ---
        base_task = {
            'task_title': data['task_title'],
            'task_description': data['task_description'],
            'due_date': data['due_date'],
            'priority': data['priority'],
            'status': 'Pending',
            'assigned_by_id': manager_id_obj,
            'assigned_by_name': manager_name,
            'created_at': datetime.utcnow()
        }

        # --- Logic for Single vs. Broadcast Task ---
        is_broadcast = data.get('is_broadcast', False)
        
        if is_broadcast:
            # Find all employees reporting to this manager
            team_members = list(employees_collection.find(
                {'reporting_manager': manager_name},
                {'_id': 1, 'employee_id': 1} # Fetch ObjectId and employee_id
            ))

            if not team_members:
                return jsonify({'error': 'No team members found to assign the task to.'}), 404

            tasks_to_insert = []
            for member in team_members:
                task = base_task.copy()
                task['assigned_to_id'] = member['_id']
                task['assigned_to_emp_id'] = member['employee_id']
                task['is_broadcast'] = True
                tasks_to_insert.append(task)
            
            if tasks_to_insert:
                tasks_collection.insert_many(tasks_to_insert)
            message = f'Task broadcasted to {len(tasks_to_insert)} team members successfully.'

        else: # Single employee assignment
            assigned_to_emp_id = data.get('assigned_to_id')
            if not assigned_to_emp_id:
                return jsonify({'error': 'assigned_to_id is required for a single task assignment'}), 400

            employee = employees_collection.find_one({'employee_id': assigned_to_emp_id})
            if not employee:
                return jsonify({'error': 'Employee to be assigned not found'}), 404

            task = base_task.copy()
            task['assigned_to_id'] = employee['_id']
            task['assigned_to_emp_id'] = employee['employee_id']
            task['is_broadcast'] = False
            tasks_collection.insert_one(task)
            message = 'Task assigned successfully.'

        return jsonify({'message': message}), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'An internal server error occurred: {str(e)}'}), 500

# --- START: NEW ENDPOINT TO UPDATE TASK STATUS ---
@app.route('/api/tasks/<task_id>/status', methods=['PUT'])
@jwt_required()
def update_task_status(task_id):
    """
    Updates the status of a specific task.
    Only the assigned employee can update their own task.
    """
    try:
        data = request.get_json()
        new_status = data.get('status')
        current_user_emp_id = get_jwt_identity()

        if not new_status or new_status not in ['Pending', 'Completed']:
            return jsonify({'error': 'Invalid status provided.'}), 400

        try:
            task_obj_id = ObjectId(task_id)
        except InvalidId:
            return jsonify({'error': 'Invalid task ID format.'}), 400

        task = tasks_collection.find_one({'_id': task_obj_id})
        if not task:
            return jsonify({'error': 'Task not found.'}), 404

        # --- Permission Check ---
        if task.get('assigned_to_emp_id') != current_user_emp_id:
            return jsonify({'error': 'Forbidden: You can only update your own tasks.'}), 403

        # --- Update Operation ---
        result = tasks_collection.update_one(
            {'_id': task_obj_id},
            {'$set': {'status': new_status}}
        )

        if result.modified_count == 0:
            return jsonify({'message': 'Task status was already set to the desired value.'}), 200

        return jsonify({'message': 'Task status updated successfully.'}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'An internal server error occurred: {str(e)}'}), 500
#

@app.route('/api/manager/employee-tasks/<emp_id>', methods=['GET'])
@jwt_required()
def get_employee_tasks_for_manager(emp_id):
    """
    Fetches all tasks for a specific employee, accessible by a manager.
    """
    try:
        # --- Permission Check (ensures the requester is a manager) ---
        claims = get_jwt()
        if claims.get('role') != 'Manager':
            return jsonify({'error': 'Forbidden: You do not have permission to access this data.'}), 403

        # Find all tasks assigned to this employee's employee_id
        assigned_tasks_cursor = tasks_collection.find({'assigned_to_emp_id': emp_id})
        
        tasks = []
        for task in assigned_tasks_cursor:
            task['_id'] = str(task['_id'])
            task['assigned_by_id'] = str(task.get('assigned_by_id'))
            task['assigned_to_id'] = str(task.get('assigned_to_id'))
            tasks.append(task)
            
        return jsonify({'tasks': tasks}), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'An internal server error occurred: {str(e)}'}), 500
# --- END: NEW ENDPOINT FOR MANAGERS TO GET EMPLOYEE TASKS ---


@app.route('/api/employee/tasks', methods=['GET'])
@jwt_required()
def get_employee_tasks():
    """
    Fetches all tasks assigned to the currently logged-in employee.
    """
    try:
        employee_emp_id = get_jwt_identity()
        
        # Find the employee document to get their ObjectId
        employee = employees_collection.find_one({'employee_id': employee_emp_id})
        if not employee:
             # Fallback for managers who might also have tasks
            employee = manager_users_collection.find_one({'employee_id': employee_emp_id})
            if not employee:
                return jsonify({'error': 'Employee not found'}), 404

        employee_obj_id = employee['_id']

        # Find all tasks assigned to this employee's ObjectId
        assigned_tasks_cursor = tasks_collection.find({'assigned_to_id': employee_obj_id})
        
        tasks = []
        for task in assigned_tasks_cursor:
            task['_id'] = str(task['_id'])
            task['assigned_by_id'] = str(task['assigned_by_id'])
            task['assigned_to_id'] = str(task['assigned_to_id'])
            tasks.append(task)
            
        return jsonify({'tasks': tasks}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'An internal server error occurred: {str(e)}'}), 500


@app.route("/api/manager/team", methods=['GET'])
@jwt_required()
def get_manager_team():
    """
    Fetches the list of employees who report to the currently logged-in manager.
    """
    try:
        # 1. Get the manager's employee_id directly from the token identity.
        manager_emp_id = get_jwt_identity()

        if not manager_emp_id:
            return jsonify({'error': 'Manager Employee ID not found in token'}), 400

        # 2. Find the manager in the 'manager_users' collection by their 'employee_id' to get their name.
        manager = db.manager_users.find_one(
            {'employee_id': manager_emp_id},
            {'name': 1}  # We only need the manager's name.
        )

        if not manager:
            return jsonify({'error': 'Access denied: Logged-in user is not a valid manager.'}), 403

        manager_name = manager.get('name')
        if not manager_name:
             return jsonify({'error': 'Could not determine the name of the logged-in manager.'}), 404

        # 3. Find all employees who have this manager's name as their 'reporting_manager'.
        team_members_cursor = employees_collection.find(
            {'reporting_manager': manager_name},
            {'_id': 0, 'name': 1, 'employee_id': 1, 'designation': 1, 'tenure_in_current_role': 1}
        )
        
        team_members = list(team_members_cursor)

        # 4. Determine the evaluation status for each team member.
        for member in team_members:
            # The status is 'Completed' if a key field like 'tenure_in_current_role' has a value.
            member['status'] = 'Completed' if pd.notna(member.get('tenure_in_current_role')) else 'In Progress'
            # We can remove the tenure field from the final output if it's not needed on the frontend.
            if 'tenure_in_current_role' in member:
                del member['tenure_in_current_role']

        return jsonify({'team': team_members}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"❌ Unhandled Error in /api/manager/team: {e}")
        return jsonify({'error': 'An internal server error occurred'}), 500

# --- END OF REPLACEMENT ---
# Add this new route to app.py to provide a list of managers

@app.route('/api/managers', methods=['GET'])
def get_all_managers():
    """
    Fetches a list of all users with the 'Manager' role.
    """
    try:
        # Query the manager_users collection to get the names of all managers
        managers_cursor = list(manager_users_collection.find({}, {'password': 0}))
        manager_list = [manager['name'] for manager in managers_cursor if 'name' in manager]

        if not manager_list:
            return jsonify({'error': 'No managers found'}), 404

        # Return a sorted, unique list of manager names
        return jsonify({'managers': sorted(list(set(manager_list)))}), 200

    except Exception as e:
        print(f"❌ Error in /api/managers: {e}")
        return jsonify({'error': 'An internal server error occurred'}), 500
# --- CORRECTED LOGIN FUNCTION ---
# In app.py

@app.route("/api/auth/login", methods=["POST"])
def login_user():
    """
    Authenticates a user and creates a token with identity and role.
    """
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = None
    # --- MODIFICATION START: Determine collection and role ---
    # We check HR users first, as they should have the highest privilege.
    collections_to_search = {
        'hr_users': 'HR',
        'manager_users': 'Manager',
        'employee_users': 'Employee'
    }
    
    user_role = None
    for collection_name, role in collections_to_search.items():
        user = db[collection_name].find_one({"email": email})
        if user:
            user_role = role
            break
    # --- MODIFICATION END ---

    if not user or not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    employee_id_for_token = user.get("employee_id")
    if not employee_id_for_token:
        return jsonify({"error": "User account is missing an Employee ID."}), 400

    # --- MODIFICATION START: Add role to token's claims ---
    additional_claims = {"role": user_role}
    access_token = create_access_token(
        identity=employee_id_for_token,
        additional_claims=additional_claims
    )
    # --- MODIFICATION END ---
    
    user_data = {
        "_id": str(user["_id"]),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user_role, # Return the determined role
        "employee_id": user.get("employee_id")
    }

    return jsonify(success=True, token=access_token, user=user_data), 200

def summarize_feedback_gemini(text, retries=3, delay=60):
    prompt = f"""
    Given the employee feedback below, provide the following:
    1. Sentiment (Positive, Neutral, Negative)
    2. Key themes (e.g., leadership, punctuality, communication)
    3. One-line summary
    4. Soft-skills score between -1.0 and +1.0

    Feedback: "{text}"
    """
    for attempt in range(retries):
        try:
            response = gemini_model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            if "429" in str(e) and attempt < retries - 1:
                time.sleep(delay)
            else:
                return f"❌ Gemini Error: {str(e)}"

# Define custom class used in the model
class AnomalyDetectorWithReason:
    def __init__(self, base_model, features):
        self.model = base_model
        self.features = features

    def predict(self, X):
        return self.model.predict(X)

    def decision_function(self, X):
        return self.model.decision_function(X)

    def explain_reason(self, row):
        reasons = []
        if 'effort_engagement_score' in row and row['effort_engagement_score'] < 1.5:
            reasons.append("Very low engagement")
        if 'burnout_risk' in row and row['burnout_risk'] > 4:
            reasons.append("High burnout risk")
        if 'peer_complaints' in row and row['peer_complaints'] >= 3:
            reasons.append("High peer complaints")
        if 'score_delta' in row and row['score_delta'] < -2:
            reasons.append("Sharp drop in performance")
        if 'hr_warnings_1' in row and row['hr_warnings_1'] == 1: # Note: original code has hr_warnings_1, your latest code has hr_warnings. Check consistency.
            reasons.append("Recent HR warning")
        return ', '.join(reasons) if reasons else "Unusual KPI pattern"

    def predict_with_reason(self, X_df):
        flags = self.model.predict(X_df)
        scores = self.model.decision_function(X_df)
        reasons = [self.explain_reason(row) if flag == -1 else "No anomaly"
                   for flag, (_, row) in zip(flags, X_df.iterrows())]
        return flags, scores, reasons

# Load models and files
PROMOTION_MODEL_PATH = './models/promotion_model.pkl'
ATTRITION_MODEL_PATH = './models/attrition_model.pkl'
LABEL_ENCODER_PATH = './models/label_encoder.pkl'
PROMOTION_FEATURES_PATH = './models/trained_features.pkl'
ATTRITION_FEATURES_PATH = './models/trained_features_attr.pkl'
ANOMALY_MODEL_PATH = './models/anomaly_detector_with_reason.pkl'

promotion_model = joblib.load(PROMOTION_MODEL_PATH)
promotion_features = joblib.load(PROMOTION_FEATURES_PATH)

attrition_model = joblib.load(ATTRITION_MODEL_PATH)
attrition_features = joblib.load(ATTRITION_FEATURES_PATH)
label_encoder = joblib.load(LABEL_ENCODER_PATH)
import sys
sys.modules['__main__'].AnomalyDetectorWithReason = AnomalyDetectorWithReason
anomaly_model = joblib.load(ANOMALY_MODEL_PATH)
anomaly_features = anomaly_model.features

# Formatting functions
def format_promotion_result(employee_name, promo_score):
    score = round(promo_score, 1)
    if score >= 80:
        level = "Highly Ready"
        recommendation = "Strong candidate for immediate promotion consideration"
        icon = "🌟"
    elif score >= 65:
        level = "Ready"
        recommendation = "Good candidate for promotion with minor development"
        icon = "✅"
    elif score >= 50:
        level = "Partially Ready"
        recommendation = "Needs focused development before promotion"
        icon = "⚡"
    else:
        level = "Not Ready"
        recommendation = "Requires significant development and improvement"
        icon = "📈"
    return {
        'employee_name': employee_name,
        'score': score,
        'level': level,
        'recommendation': recommendation,
        'icon': icon
    }

def format_attrition_result(employee_name, attr_label):
    if attr_label == "High":
        level = "High Risk"
        recommendation = "Immediate retention measures recommended"
        icon = "🚨"
    elif attr_label == "Medium":
        level = "Moderate Risk"
        recommendation = "Monitor closely and engage proactively"
        icon = "⚠️"
    elif attr_label == "Low":
        level = "Very Low Risk"
        recommendation = "Stable and engaged employee"
        icon = "🟢"
    else:
        level = "Unknown"
        recommendation = "No classification available"
        icon = "❓"
    return {
        'employee_name': employee_name,
        'risk_level': level,
        'recommendation': recommendation,
        'icon': icon
    }

def format_anomaly_result(score, reason):
    is_specific_reason = reason.strip().lower() not in ["", "no anomaly", "no unusual patterns found.", "unusual kpi pattern"]

    if is_specific_reason:
        status = "Anomaly Detected"
        icon = "❗"
        description = reason
    else:
        return {
            'anomaly_status': "Normal",
            'anomaly_score': round(score, 3),
            'description': "",
            'icon': "✅"
        }

    return {
        'anomaly_status': status,
        'anomaly_score': round(score, 3),
        'description': description,
        'icon': icon
    }

@app.route('/')
def index():
    return render_template('index.html')

# ✅ START: MODIFIED /upload ROUTE
@app.route('/upload', methods=['POST'])
def upload_file():
    print("✅ Flask /upload route was called")

    if 'file' not in request.files:
        return "No file uploaded.", 400

    file = request.files['file']
    if file.filename == '':
        return "No selected file.", 400

    if file and file.filename.endswith('.csv'):
        filename = secure_filename(file.filename)
        input_path = os.path.join(UPLOAD_FOLDER, filename)

        try:
            file.save(input_path)
            raw_df = pd.read_csv(input_path)
            raw_data_for_mongo = raw_df.replace({np.nan: None}).to_dict(orient='records')

            # 1. Clear the staging collection to ensure it only holds the latest upload
            staging_collection.delete_many({})
            print("✅ Staging collection cleared.")

            # 2. Insert new data into the staging collection instead of the main one
            if raw_data_for_mongo:
                staging_collection.insert_many(raw_data_for_mongo)
                print(f"✅ Inserted {len(raw_data_for_mongo)} records into staging collection.")

        except Exception as e:
            import traceback
            traceback.print_exc()
            return f"❌ Error during file processing and staging: {str(e)}", 500

        # The response signals success to the frontend
        return jsonify({
            "message": "Data uploaded and staged successfully for evaluation",
            "redirect_url": "/search-employee" 
        }), 200

    return "Invalid file type. Please upload a CSV file.", 400
# ✅ END: MODIFIED /upload ROUTE


# --- MODIFIED: This route now calculates employee-specific stats ---
# --- MODIFIED: This route now calculates employee-specific stats AND manager counts ---
# In app.py, replace the entire old dashboard_data function with this one.

# In app.py, replace the dashboard_data function with this final version.


# In app.py, replace the dashboard_data function with this final version.

@app.route('/api/dashboard-data', methods=['GET'])
def dashboard_data():
    try:
        # --- START OF MODIFICATION ---
        
        # 1. Get full documents for all managers from the 'manager_users' collection.
        manager_docs = list(manager_users_collection.find({}, {'password': 0}))
        
        # 2. Get all personnel records from the 'employees' collection.
        all_personnel = list(employees_collection.find({}))

        # 3. Create a unified list.
        # This step adds managers to the personnel list if they don't already have their own record.
        employee_names = {person.get('name') for person in all_personnel}
        
        for manager in manager_docs:
            manager_name = manager.get('name')
            if manager_name not in employee_names:
                # If the manager is not in the employees list, create a record for them.
                all_personnel.append(manager)

        # 4. Ensure all managers have the correct role, even if they already had a record.
        manager_names_set = {manager.get('name') for manager in manager_docs}
        for person in all_personnel:
            if person.get('name') in manager_names_set:
                person['role'] = 'Manager'

        # --- END OF MODIFICATION ---

        if not all_personnel:
            return jsonify({
                'total_personnel': 0, 'employee_total': 0, 'manager_total': 0,
                'employee_completed': 0, 'employee_in_progress': 0,
                'employee_list': [], 'manager_list': []
            })

        df = pd.DataFrame(all_personnel)
        df = df.dropna(how='all')

        # If the role column is still missing for some records, default it to Employee.
        if 'role' not in df.columns:
            df['role'] = 'Employee'
        else:
            df['role'] = df['role'].fillna('Employee')

        total_personnel = len(df)
        
        employees_df = df[df['role'] != 'Manager']
        
        employee_total = len(employees_df)
        employee_completed = employees_df['tenure_in_current_role'].notna().sum()
        employee_in_progress = employee_total - employee_completed

        employee_list = []
        manager_list = []
        
        df['status'] = np.where(df['tenure_in_current_role'].isna(), 'In Progress', 'Completed')
        
        cols_for_list = ['name', 'reporting_manager', 'status', 'role']
        all_users_for_list = df[cols_for_list].fillna('-').to_dict(orient='records')

        for user in all_users_for_list:
            if user.get('role') == 'Employee':
                employee_list.append(user)
            else :
                manager_list.append(user)

        manager_total = len(manager_list)

        response = {
            'total_personnel': int(total_personnel),
            'employee_total': int(employee_total),
            'manager_total': int(manager_total),
            'employee_completed': int(employee_completed),
            'employee_in_progress': int(employee_in_progress),
            'employee_list': employee_list,
            'manager_list': manager_list
        }
        return jsonify(response)

    except Exception as e:
        print("❌ Error in /api/dashboard-data:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# --- REVISED: Endpoint to get all users for the EmployeeList/Manager Dashboard page ---

@app.route('/api/employees/all', methods=['GET'])
def get_all_personnel():
    try:
        # 1. Fetch all managers and employees from their respective collections
        manager_docs = list(manager_users_collection.find({}, {'password': 0, '_id': 0}))
        employee_docs = list(employees_collection.find({}, {'_id': 0}))

        # 2. Create a unified list of all personnel
        unified_personnel = employee_docs
        employee_names = {person.get('name') for person in unified_personnel}
        
        # Add managers who are not already in the employee list
        for manager in manager_docs:
            if manager.get('name') not in employee_names:
                unified_personnel.append(manager)

        # 3. Ensure roles and status are correctly set for everyone
        manager_names_set = {manager.get('name') for manager in manager_docs}
        
        for person in unified_personnel:
            # Assign 'Manager' role to anyone found in the manager list
            if person.get('name') in manager_names_set:
                person['role'] = 'Manager'
            # Default to 'Employee' if role is missing
            elif 'role' not in person or not person['role']:
                person['role'] = 'Employee'
            
            # Determine evaluation status based on a data field (like tenure)
            person['status'] = 'Completed' if pd.notna(person.get('tenure_in_current_role')) else 'In Progress'
            
            # Provide a fallback for designation if it's missing
            if 'designation' not in person or pd.isna(person.get('designation')):
                person['designation'] = person.get('role', 'N/A')

        return jsonify({'users': unified_personnel})

    except Exception as e:
        print("❌ Error in /api/employees/all:", str(e))
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An internal server error occurred'}), 500

# ✅ START: MODIFIED /api/employees ROUTE
@app.route('/api/employees', methods=['GET'])
def get_employee_names():
    try:
        # --- CHANGE: Point this back to the staging_collection for the CSV upload workflow ---
        employees = list(staging_collection.find({}, {'name': 1, 'employee_id': 1, '_id': 0}))
        names = [emp.get('name') for emp in employees if emp.get('name')]
        return jsonify({'names': names})
    except Exception as e:
        print("❌ Error in /api/employees:", str(e))
        return jsonify({'error': str(e)}), 500
# ✅ END: MODIFIED /api/employees ROUTE

@app.route('/search', methods=['GET', 'POST'])
def search_employee():
    if request.method == 'POST':
        employee_name = request.form.get('employee_name')
        
        employee_data_dict = staging_collection.find_one({'name': employee_name})

        if not employee_data_dict:
            return jsonify({'error': f"Employee '{employee_name}' not found in the uploaded file."}), 404

        # --- START: NEW VALIDATION LOGIC ---
        # We check for a key field to determine if the record is complete enough for evaluation.
        # If 'tenure_in_current_role' is missing or null, we stop the process.
        if not employee_data_dict.get('tenure_in_current_role'):
            return jsonify({'error': 'Details not filled. The employee record from the uploaded file is incomplete.'}), 422 # 422: Unprocessable Entity
        # --- END: NEW VALIDATION LOGIC ---

        # The rest of the prediction logic remains the same...
        employee_data = pd.DataFrame([employee_data_dict])
        try:
            # ... (all your prediction code here is fine) ...
            promo_input_cols = [col for col in promotion_features if col in employee_data.columns]
            attrition_input_cols = [col for col in attrition_features if col in employee_data.columns]
            anomaly_input_cols = [col for col in anomaly_features if col in employee_data.columns]

            promo_input = employee_data[promo_input_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
            attrition_input = employee_data[attrition_input_cols].apply(pd.to_numeric, errors='coerce').fillna(0)
            anomaly_input = employee_data[anomaly_input_cols].apply(pd.to_numeric, errors='coerce').fillna(0)

            for feature in promotion_features:
                if feature not in promo_input.columns:
                    promo_input[feature] = 0
            for feature in attrition_features:
                if feature not in attrition_input.columns:
                    attrition_input[feature] = 0
            for feature in anomaly_features:
                if feature not in anomaly_input.columns:
                    anomaly_input[feature] = 0

            promo_input = promo_input[promotion_features]
            attrition_input = attrition_input[attrition_features]
            anomaly_input = anomaly_input[anomaly_features]

            flags, scores, reasons = anomaly_model.predict_with_reason(anomaly_input)
            promo_score = promotion_model.predict(promo_input)[0]
            attr_class = attrition_model.predict(attrition_input)[0]
            attr_label = label_encoder.inverse_transform([attr_class])[0]
            anomaly_score = scores[0]
            reason = reasons[0]
            
            feedback_text = "\n".join([
                f"{col.replace('_', ' ').title()}: {employee_data_dict.get(col, '')}"
                for col in ['manager_comments', 'hr_notes', 'peer_reviews', 'client_feedback']
                if employee_data_dict.get(col) is not None and str(employee_data_dict.get(col)).strip() != ''
            ])

            if feedback_text.strip():
                feedback_summary = summarize_feedback_gemini(feedback_text)
            else:
                feedback_summary = "No feedback provided for this employee."

            promo_result = format_promotion_result(employee_name, promo_score)
            promo_result['employee_id'] = employee_data_dict.get('employee_id')
            promo_result['department'] = employee_data_dict.get('department')
            promo_result['role'] = employee_data_dict.get('designation')

            kpi_scores = {
                'Leadership': employee_data_dict.get('leadership_score'),
                'Integrity Feedback': employee_data_dict.get('integrity_feedback_score'),
                'Collaboration & Communication': employee_data_dict.get('collaboration_communication_score'),
                'Adaptability & Growth': employee_data_dict.get('adaptability_growth_score'),
                'Skill Development': employee_data_dict.get('skill_development_score'),
                'Effort & Engagement': employee_data_dict.get('effort_engagement_score')
            }
            promo_result['kpi_scores'] = {k: v for k, v in kpi_scores.items() if v is not None}

            result_data = {
                'promotion': promo_result,
                'attrition': format_attrition_result(employee_name, attr_label),
                'anomaly': format_anomaly_result(anomaly_score, reason),
                'feedback_summary': feedback_summary
            }

            return jsonify(result_data), 200

        except Exception as e:
            import traceback
            traceback.print_exc()
            return jsonify({'error': f"Error during prediction: {str(e)}"}), 500

    # For GET request, render the search page with names from the STAGING collection
    employee_names_cursor = staging_collection.find({}, {'name': 1, '_id': 0})
    employee_names = [doc['name'] for doc in employee_names_cursor if 'name' in doc]
    employee_names = sorted(list(set(employee_names))) 
    return render_template('search_employee.html', names=employee_names)
# ✅ END: MODIFIED /search ROUTE

# All subsequent code remains the same as in your original file.
# ... (paste the rest of your app.py code from get_insights() onwards) ...
@app.route('/api/insights')
def get_insights():
    import numpy as np
    from flask import jsonify

    try:
        # Load all data from MongoDB
        all_employees_data = list(employees_collection.find({}))
        if not all_employees_data:
            return jsonify({'error': 'No employee data found in MongoDB'}), 404

        df = pd.DataFrame(all_employees_data)

        # Ensure numeric columns are actually numeric, coercing errors
        for col in ['overall_weighted_score', 'leadership_score', 'integrity_feedback_score',
                    'collaboration_communication_score', 'adaptability_growth_score',
                    'skill_development_score', 'effort_engagement_score']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        df = df.dropna(subset=['overall_weighted_score']) # Drop rows where overall_weighted_score couldn't be converted

        # 1️⃣ Overall Org Score
        overall_score = round(df['overall_weighted_score'].mean(), 2) if not df.empty else 0.0

        # 2️⃣ Category-wise Breakdown
        category_cols = [
            'leadership_score',
            'integrity_feedback_score',
            'collaboration_communication_score',
            'adaptability_growth_score',
            'skill_development_score',
            'effort_engagement_score'
        ]
        category_scores = []
        for col in category_cols:
            if col in df.columns and not df[col].dropna().empty: # Check if column exists and has non-NaN values
                category_scores.append({
                    'category': col.replace('_score', '').replace('_', ' ').title(),
                    'score': round(df[col].mean(), 2)
                })
            else:
                category_scores.append({
                    'category': col.replace('_score', '').replace('_', ' ').title(),
                    'score': 0.0 # Default if no data
                })

        # 3️⃣ Radar Skill Balance
        radar_cols = [
            'leadership_score',
            'collaboration_communication_score',
            'adaptability_growth_score',
            'skill_development_score',
            'effort_engagement_score'
        ]
        skill_balance = []
        for col in radar_cols:
            if col in df.columns and not df[col].dropna().empty:
                skill_balance.append({
                    'skill': col.replace('_score', '').replace('_', ' ').title(),
                    'value': round(df[col].mean(), 2)
                })
            else:
                skill_balance.append({
                    'skill': col.replace('_score', '').replace('_', ' ').title(),
                    'value': 0.0 # Default if no data
                })

        # 4️⃣ Monthly Trends (mocked if no dates in MongoDB)
        trends = []
        # If your MongoDB documents contain 'evaluation_month' or a similar date field
        if 'evaluation_month' in df.columns and not df['evaluation_month'].dropna().empty:
            grouped = df.groupby('evaluation_month')['overall_weighted_score'].mean()
            trends = [{'month': month, 'avg_score': round(score, 2)} for month, score in grouped.items()]
        else:
            # Simulated months for demo/testing if no actual date data
            trends = [
                {'month': 'Jan', 'avg_score': 3.2},
                {'month': 'Feb', 'avg_score': 3.5},
                {'month': 'Mar', 'avg_score': 3.7},
                {'month': 'Apr', 'avg_score': 3.9},
                {'month': 'May', 'avg_score': 4.0},
            ]

        # 5️⃣ Team-wise Heatmap Data
        heatmap = []
        if 'department' in df.columns and not df['department'].dropna().empty:
            # Filter radar_cols to only those present in the DataFrame
            actual_radar_cols = [col for col in radar_cols if col in df.columns]

            if not df['department'].empty and not actual_radar_cols:
                # Handle case where department column exists but no relevant radar_cols
                heatmap = [] # Or default heatmap data if needed
            elif not df['department'].empty and actual_radar_cols:
                grouped = df.groupby('department')[actual_radar_cols].mean().round(2)
                for dept, row in grouped.iterrows():
                    entry = {'team': dept}
                    for col, val in row.items():
                        label = col.replace('_score', '').replace('_', ' ').title()
                        entry[label] = val
                    heatmap.append(entry)
            else:
                heatmap = [] # Default if 'department' column is missing or empty
        else:
            heatmap = [] # Default if 'department' column is missing or empty


        return jsonify({
            'overall_score': overall_score,
            'category_scores': category_scores,
            'skill_balance': skill_balance,
            'monthly_trends': trends,
            'team_heatmap': heatmap
        })

    except Exception as e:
        print("❌ Error in /api/insights:", str(e))
        return jsonify({'error': str(e)}), 500

# MANUAL_FILE is no longer relevant as data will be in MongoDB
# MANUAL_FILE = './uploads/newskeleton.csv'

ALL_COLUMNS = [
    # HR Core
    "employee_id", "name", "department", "designation", "date_of_joining", "work_location",
    "reporting_manager", "employment_type", "tenure_in_current_role", "past_roles_held",
    "total_experience", "avg_hours_logged_vs_team", "task_completion_ratio", "active_workdays",
    "voluntary_contributions", "burnout_risk", "responsiveness", "meeting_participation",
    "task_ownership", "adherence_to_deadlines", "work_quality_consistency", "conversion_rate",
    "revenue_generated", "upsell_opportunities_closed", "client_retention_rate",
    "crm_followup_consistency", "code_commits", "bug_fix_count", "sprint_velocity",
    "deployment_frequency", "code_quality", "model_accuracy", "feature_engineering",
    "experiment_reproducibility", "model_deployment_count", "tech_debt_reduction",
    "positions_filled", "onboarding_satisfaction", "training_sessions_delivered",
    "employee_engagement_score", "policy_compliance_x", "feature_delivery_timeliness",
    "roadmap_adherence", "cross_team_coordination", "sprint_success_rate", "stakeholder_ratings",
    "ledger_accuracy", "compliance_adherence", "invoice_processing_efficiency",
    "audit_readiness_score", "report_submission_punctuality", "campaign_reach", "leads_generated",
    "social_engagement_rate", "seo_improvement", "content_delivery_timeliness",
    "test_cases_executed", "bugs_reported", "automation_coverage", "regression_pass_rate",
    "defect_leakage_rate", "budget_forecasting_accuracy", "variance_analysis_score",
    "report_timeliness", "cost_saving_suggestions", "financial_modeling_score", "uptime_percentage",
    "mttr", "successful_deployments", "cicd_pipeline_efficiency", "incident_response_time",
    "design_delivery_timeliness", "usability_test_score", "rework_count", "visual_consistency",
    "accessibility_score", "reports_delivered", "insight_accuracy", "query_efficiency",
    "dashboard_usage_rate", "data_quality_score", "certifications_completed",
    "online_courses_attended", "training_hours_logged", "knowledge_contributions",
    "hackathon_participation", "innovation_submissions", "peer_review_rating",
    "manager_feedback", "meeting_participation_rate", "communication_effectiveness",
    "conflict_resolution", "mentorship_participation", "client_communication",
    "response_to_change", "initiative_in_projects", "adaptability_to_change",
    "promotion_recommendation", "retention_suggestion", "leadership_score",
    "stress_load_tolerance", "special_recognitions", "hr_warnings", "peer_complaints",
    "recognition_received", "policy_compliance_y", "ethics_confidentiality",
    "total_experience_score", "internal_transfers", "promotions_achieved", "projects_handled",

    "past_ratings_history", "score_delta", "manager_comments", "hr_notes", "peer_reviews",
    "client_feedback", "effort_engagement_score", "role_specific_kpi_score",
    "skill_development_score", "collaboration_communication_score", "adaptability_growth_score",
    "integrity_feedback_score", "historical_progress_score", "overall_weighted_score",
    "email", "role" # Added email and role to the list of all columns
    ]

# Minimum required fields for new employee
REQUIRED_FIELDS = [
    'employee_id', 'name', 'designation', 'department',
    'reporting_manager', 'employment_type', 'work_location', 'date_of_joining'
]

# Full list of HR fields (columns in newskeleton.csv, adjusted for MongoDB use)
ALL_HR_FIELDS = [
    'employee_id', 'name', 'designation', 'department', 'reporting_manager',
    'employment_type', 'work_location', 'date_of_joining',
    'total_experience', 'past_roles_held', 'internal_transfers', 'promotions_achieved',
    'certifications_completed', 'online_courses_attended', 'training_hours_logged',
    'recognition_received', 'special_recognitions',
    'onboarding_satisfaction', 'policy_compliance_x', 'policy_compliance_y', 'ethics_confidentiality', # combined policy_compliance
    'compliance_adherence', 'hr_warnings', 'hr_notes',
    'hackathon_participation', 'mentorship_participation',
    'innovation_submissions', 'knowledge_contributions'
]


# --- MODIFIED: This route now handles creating users based on Role ---
@app.route('/manual-entry/hr', methods=['POST'])
def manual_entry_hr():
    try:
        data = request.get_json()
        print("📥 HR Form Data:", data)

        if not data:
            return jsonify({'error': 'Empty or invalid JSON received'}), 400

        # --- This part is now only for new entries ---
        is_new_entry = not employees_collection.find_one({'employee_id': data.get('employee_id')})

        role = data.get('role', 'Employee')

        # --- User Account Creation ---
        user_fields = ['employee_id', 'name', 'email', 'password']
        missing_user_fields = [f for f in user_fields if not data.get(f)]
        if missing_user_fields:
            return jsonify({'error': f'Missing required fields for user account: {", ".join(missing_user_fields)}'}), 400

        user_collection_name = 'manager_users' if role == 'Manager' else 'employee_users'
        user_collection = db[user_collection_name]

        if user_collection.find_one({'employee_id': data['employee_id']}):
            return jsonify({'error': f'An employee with this ID already exists as a {role.lower()}.'}), 409
        if user_collection.find_one({'email': data['email']}):
            return jsonify({'error': f'A user with this email already exists as a {role.lower()}.'}), 409

        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        user_doc = {
            "employee_id": data['employee_id'],
            "name": data['name'],
            "email": data['email'],
            "password": hashed_password,
            "role": role
        }
        user_collection.insert_one(user_doc)
        print(f"✅ {role} account created for {data['employee_id']} in '{user_collection_name}'")

        # --- HR Record Creation in 'employees' collection ---
        hr_document = {col: data.get(col, None) for col in ALL_COLUMNS}
        if 'password' in hr_document:
            del hr_document['password']
        
        employees_collection.update_one(
            {'employee_id': data['employee_id']},
            {'$set': hr_document},
            upsert=True
        )
        print(f"✅ HR entry for {data['employee_id']} ({role}) saved/updated in 'employees'")

        # --- START: NEW FEATURE - Update Manager's Team List ---
        # This block executes only when creating a new employee (not a manager) who has a reporting manager assigned.
        if is_new_entry and role == 'Employee' and data.get('reporting_manager'):
            manager_name = data.get('reporting_manager')
            new_employee_info = {
                "employee_id": data.get('employee_id'),
                "name": data.get('name')
            }

            # Find the manager in the 'manager_users' collection by their name
            manager_user_collection = db['manager_users']
            
            # Use $addToSet to add the new employee to the manager's 'team_members' array.
            # This prevents adding duplicates if the operation is somehow run more than once.
            update_result = manager_user_collection.update_one(
                {'name': manager_name},
                {'$addToSet': {'team_members': new_employee_info}}
            )

            if update_result.matched_count > 0:
                if update_result.modified_count > 0:
                    print(f"✅ Successfully added '{new_employee_info['name']}' to manager '{manager_name}'s team list.")
                else:
                    # This means the employee was already in the list, which is fine.
                    print(f"ℹ️  Employee '{new_employee_info['name']}' already exists in manager '{manager_name}'s team list.")
            else:
                # This is a crucial check. It handles cases where the manager's name from the form doesn't exist.
                print(f"⚠️ Warning: Reporting manager '{manager_name}' not found in 'manager_users' collection. Could not update team list.")
        # --- END: NEW FEATURE ---
        
        return jsonify({'message': f'{role} account and HR record created successfully!'}), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An internal server error occurred: ' + str(e)}), 500



# In app.py, replace the old fetch_employee_hr_by_id with this one.

@app.route('/manual-entry/hr/<emp_id>', methods=['GET'])
@jwt_required()
def fetch_employee_hr_by_id(emp_id):
    try:
        emp_id = emp_id.strip()
        token_emp_id = get_jwt_identity()
        claims = get_jwt()
        user_role = claims.get('role')

        # --- Permission logic remains the same ---
        has_permission = False
        if token_emp_id == emp_id:
            has_permission = True
        if not has_permission and user_role == 'HR':
            has_permission = True
        if not has_permission and user_role == 'Manager':
            manager_doc = db.manager_users.find_one({'employee_id': token_emp_id}, {'name': 1})
            if manager_doc:
                manager_name = manager_doc.get('name')
                employee_doc = employees_collection.find_one({'employee_id': emp_id}, {'reporting_manager': 1})
                if employee_doc and employee_doc.get('reporting_manager') == manager_name:
                    has_permission = True
        if not has_permission:
            return jsonify({'error': 'Forbidden: You do not have permission to access this data.'}), 403
        
        # --- Logic to fetch from either collection (remains the same) ---
        emp_data = employees_collection.find_one({'employee_id': emp_id})
        if not emp_data:
            emp_data = manager_users_collection.find_one({'employee_id': emp_id})

        if not emp_data:
            return jsonify({'error': f'Employee {emp_id} not found in any collection'}), 404

        # --- Date formatting logic (remains the same) ---
        date_field = 'date_of_joining'
        if date_field in emp_data and emp_data[date_field]:
            try:
                date_obj = pd.to_datetime(emp_data[date_field], dayfirst=True)
                emp_data[date_field] = date_obj.strftime('%Y-%m-%d')
            except (ValueError, TypeError):
                emp_data[date_field] = None

        if '_id' in emp_data:
            emp_data['_id'] = str(emp_data['_id'])

        # --- START OF THE FIX ---
        # The original cleaning logic caused the error. This new logic handles arrays correctly.
        clean_data = {}
        for key, value in emp_data.items():
            # If the value is a list (like 'team_members'), keep it as is.
            if isinstance(value, list):
                clean_data[key] = value
            # Otherwise, apply the NaN check for all other single values.
            else:
                clean_data[key] = None if pd.isna(value) else value
        # --- END OF THE FIX ---

        return jsonify(clean_data), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
@app.route('/manual-entry/hr/<emp_id>', methods=['PUT'])
def update_employee_by_id(emp_id):
    try:
        data = request.get_json()
        emp_id = emp_id.strip()
        (f"🛠 Updating HR data for {emp_id} with:", data)

        # --- START OF FIX ---
        # Create a new dictionary, converting empty strings to None (which becomes null in MongoDB).
        # This prevents saving empty strings for fields that were cleared in the form.
        update_payload = {key: (value if value != "" else None) for key, value in data.items()}

        # As a safeguard, explicitly remove fields that should never be changed via this endpoint.
        immutable_fields = ['_id', 'password', 'email', 'role', 'employee_id']
        for field in immutable_fields:
            if field in update_payload:
                del update_payload[field]
        # --- END OF FIX ---

        # Use the cleaned 'update_payload' for the database operation.
        result = employees_collection.update_one(
            {'employee_id': emp_id},
            {'$set': update_payload}
        )

        if result.matched_count == 0:
            return jsonify({'error': 'Employee not found'}), 404

        return jsonify({'message': 'Employee record updated successfully!'}), 200

    except Exception as e:
        print("❌ Error in update_employee_by_id:", str(e))
        return jsonify({'error': str(e)}), 500    


@app.route('/api/employees/<emp_id>', methods=['DELETE'])
@jwt_required()
def delete_employee(emp_id):
    """
    Deletes an employee from all relevant collections.
    This action is restricted to users with the 'HR' role.
    """
    try:
        # 1. Permission Check: Ensure the user has the 'HR' role.
        claims = get_jwt()
        if claims.get('role') != 'HR':
            return jsonify({'error': 'Forbidden: You do not have permission to perform this action.'}), 403

        emp_id = emp_id.strip()
        if not emp_id:
            return jsonify({'error': 'Employee ID is required for deletion.'}), 400

        # 2. Find the employee record to get their details before deletion.
        employee_to_delete = employees_collection.find_one({'employee_id': emp_id})
        if not employee_to_delete:
            # If no record is found, it's safe to report success as the desired state is achieved.
            return jsonify({'message': f"Employee with ID '{emp_id}' was not found or already deleted."}), 200

        reporting_manager_name = employee_to_delete.get('reporting_manager')

        # 3. Delete the main employee data from the 'employees' collection.
        employees_collection.delete_one({'employee_id': emp_id})
        print(f"✅ Deleted employee '{emp_id}' from 'employees' collection.")

        # 4. Delete the user login record from the 'employee_users' collection.
        db.employee_users.delete_one({'employee_id': emp_id})
        print(f"✅ Deleted user account for '{emp_id}' from 'employee_users' collection.")

        # 5. If they reported to a manager, remove them from that manager's team list.
        if reporting_manager_name:
            db.manager_users.update_one(
                {'name': reporting_manager_name},
                {'$pull': {'team_members': {'employee_id': emp_id}}}
            )
            print(f"✅ Removed '{emp_id}' from manager '{reporting_manager_name}'s team list.")

        return jsonify({'message': f"Employee '{emp_id}' has been permanently deleted."}), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'An internal server error occurred during deletion: {str(e)}'}), 500
# ✅ END: NEW DELETE EMPLOYEE ENDPOINT


@app.route('/manual-entry/employee', methods=['GET'])
def get_employee_by_id():
    employee_id = request.args.get('employee_id')

    if not employee_id:
        return jsonify({'error': 'Missing employee_id parameter'}), 400

    try:
        employee_row = employees_collection.find_one({'employee_id': employee_id})

        if not employee_row:
            return jsonify({'error': 'Employee not found'}), 404

        # HR fields you want to display as read-only
        hr_fields = [
            'employee_id',
            'name',
            'department',
            'designation',
            'date_of_joining',
            'employment_type',
            'reporting_manager'
        ]

        # Extract values safely
        result = {
            field: employee_row.get(field)
            for field in hr_fields
        }
        # Convert None to empty string for display in forms if desired
        result = {k: (v if v is not None else "") for k, v in result.items()}

        return jsonify(result), 200

    except Exception as e:
        print("❌ Error in get_employee_by_id:", str(e))
        return jsonify({'error': str(e)}), 500


@app.route('/manual-entry/employees', methods=['GET'])
def get_all_employees_from_hr_file():
    try:
        # Use a dictionary to store unique personnel by employee_id to avoid duplicates
        all_personnel = {}

        # 1. Fetch all regular employees from the 'employees' collection
        employees_cursor = employees_collection.find({}, {'employee_id': 1, 'name': 1, 'reporting_manager': 1, '_id': 0})
        for doc in employees_cursor:
            if doc.get('employee_id'):
                all_personnel[doc['employee_id']] = {
                    'employee_id': doc.get('employee_id'),
                    'name': doc.get('name'),
                    'reporting_manager': doc.get('reporting_manager')
                }
        
        # 2. Fetch all managers from the 'manager_users' collection and add/update them in the list
        managers_cursor = manager_users_collection.find({}, {'employee_id': 1, 'name': 1, '_id': 0})
        for doc in managers_cursor:
            if doc.get('employee_id'):
                # Get existing entry if it exists, or an empty dict
                existing_entry = all_personnel.get(doc['employee_id'], {})
                
                # Update with manager info. The name from manager_users is likely authoritative.
                existing_entry['employee_id'] = doc['employee_id']
                existing_entry['name'] = doc['name']
                
                # If 'reporting_manager' is not set, it will be None
                if 'reporting_manager' not in existing_entry:
                    existing_entry['reporting_manager'] = None
                
                # Put the updated/new entry back into the main dictionary
                all_personnel[doc['employee_id']] = existing_entry

        # Convert the dictionary of unique personnel back to a list
        employees_list = list(all_personnel.values())

        if not employees_list:
            return jsonify({'error': 'No employee or manager records found in MongoDB'}), 404

        # Return employee list for the frontend dropdown
        return jsonify({'employees': employees_list}), 200

    except Exception as e:
        print("❌ Error loading combined employee and manager list:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/manual-entry/tl', methods=['POST'])
def save_manual_tl_data():
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')

        if not employee_id:
            return jsonify({'error': 'Employee ID is required'}), 400

        # Find the employee document
        emp_document = employees_collection.find_one({'employee_id': employee_id})
        if not emp_document:
            return jsonify({'error': 'Employee ID not found'}), 404

        # Merge TL data into the document
        for key, value in data.items():
            emp_document[key] = value

        # Compute derived KPIs
        emp_document_with_kpis = compute_all_derived_kpis(emp_document)
        
        # Clean NaN values before saving to MongoDB
        cleaned_doc = {k: (None if pd.isna(v) else v) for k, v in emp_document_with_kpis.items()}

        # Update the document in MongoDB
        employees_collection.update_one(
            {'employee_id': employee_id},
            {'$set': cleaned_doc}
        )

        print(f'✅ TL evaluation completed and saved for {employee_id}')
        return jsonify({'message': '✅ Evaluation completed and saved'}), 200

    except Exception as e:
        print("❌ Error in /manual-entry/tl:", str(e))
        return jsonify({'error': str(e)}), 500

# CSV_FILE is no longer relevant, as updates go directly to MongoDB
# CSV_FILE = './uploads/newskeleton.csv'

@app.route('/manual-entry/tl/<emp_id>', methods=['PUT'])
def update_tl_entry(emp_id):
    try:
        data = request.get_json()
        print(f"📥 TL Data for {emp_id}:", data)

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        emp_id = emp_id.strip()

        # Find the employee document
        existing_doc = employees_collection.find_one({'employee_id': emp_id})
        if not existing_doc:
            return jsonify({'error': f'Employee ID {emp_id} not found'}), 404

        # Update the document with new data
        update_fields = {k: v for k, v in data.items() if k != '_id'} # Exclude _id if it was passed
        existing_doc.update(update_fields) # Merge new data into existing doc

        # Compute derived KPIs based on the updated document
        updated_doc_with_kpis = compute_all_derived_kpis(existing_doc)

        # Clean NaN values before saving to MongoDB to ensure JSON compatibility
        # NaN is not a valid BSON/JSON type and should be stored as null (None in Python).
        cleaned_doc = {k: (None if pd.isna(v) else v) for k, v in updated_doc_with_kpis.items()}

        # Save updated document back to MongoDB
        result = employees_collection.update_one(
            {'employee_id': emp_id},
            {'$set': cleaned_doc}
        )

        if result.matched_count == 0:
            return jsonify({'error': f'Employee ID {emp_id} not found for update'}), 404

        print(f"✅ TL entry for {emp_id} updated in MongoDB")
        return jsonify({'message': f'TL data updated for {emp_id}'}), 200

    except Exception as e:
        print("❌ Error in TL route:", str(e))
        return jsonify({'error': str(e)}), 500


def safe_weighted_avg(components, row):
    values = []
    for col, weight in components.items():
        val = row.get(col)
        try:
            val = float(val) if val is not None else np.nan
        except (ValueError, TypeError):
            val = np.nan
        values.append(val)
    values = np.array(values)
    weights = np.array(list(components.values()))
    mask = ~np.isnan(values)
    if mask.sum() == 0:
        return 3 # Default score if no valid components
    return round(np.average(values[mask], weights=weights[mask]))


def communication_effectiveness(row):
    return safe_weighted_avg({'peer_review_rating': 0.4, 'manager_feedback': 0.3, 'conflict_resolution': 0.3}, row)

def responsiveness(row):
    return safe_weighted_avg({'communication_effectiveness': 0.5, 'report_submission_punctuality': 0.25, 'meeting_participation_rate': 0.25}, row)

def meeting_participation(row):
    return safe_weighted_avg({'meeting_participation_rate': 0.6, 'communication_effectiveness': 0.4}, row)

def effort_engagement_score(row):
    return safe_weighted_avg({'active_workdays': 0.25, 'task_completion_ratio': 0.35, 'meeting_participation': 0.2, 'responsiveness': 0.2}, row)

def adaptability_growth_score(row):
    return safe_weighted_avg({'adaptability_to_change': 0.4, 'response_to_change': 0.3, 'initiative_in_projects': 0.3}, row)

def integrity_feedback_score(row):
    # Adjust for policy_compliance_x and policy_compliance_y if they are sometimes one field
    policy_x = row.get('policy_compliance_x')
    policy_y = row.get('policy_compliance_y')

    # Prioritize policy_compliance_x if available, otherwise use policy_compliance_y
    policy_compliance_val = policy_x if policy_x is not None else policy_y

    temp_row = row.copy()
    temp_row['policy_compliance'] = policy_compliance_val # Create a unified field for calculation

    return safe_weighted_avg({'policy_compliance': 0.7, 'ethics_confidentiality': 0.3}, temp_row)


def historical_progress_score(row):
    # Ensure values are numeric before comparison
    score_delta = float(row.get('score_delta', 0)) if row.get('score_delta') is not None else 0
    past_roles_held = float(row.get('past_roles_held', 0)) if row.get('past_roles_held') is not None else 0
    promotions_achieved = float(row.get('promotions_achieved', 0)) if row.get('promotions_achieved') is not None else 0

    return safe_weighted_avg({'score_delta': 0.4, 'past_roles_held': 0.3, 'promotions_achieved': 0.3},
                             {'score_delta': score_delta, 'past_roles_held': past_roles_held, 'promotions_achieved': promotions_achieved})

def collaboration_communication_score(row):
    return safe_weighted_avg({'communication_effectiveness': 0.3, 'peer_review_rating': 0.3, 'conflict_resolution': 0.2, 'cross_team_coordination': 0.2}, row)

def task_ownership(row):
    try:
        init = float(row.get('initiative_in_projects', 3)) if row.get('initiative_in_projects') is not None else 3
    except:
        init = 3
    try:
        delta = float(row.get('score_delta', 0)) if row.get('score_delta') is not None else 0
    except:
        delta = 0

    if init >= 4 and delta >= 0.5:
        return 5
    elif init >= 3.5:
        return 4
    elif init >= 2.5:
        return 3
    elif init >= 1.5:
        return 2
    else:
        return 1

def leadership_score(row):
    return safe_weighted_avg({'initiative_in_projects': 0.4, 'task_ownership': 0.3, 'communication_effectiveness': 0.3}, row)

def overall_weighted_score(row):
    return safe_weighted_avg({
        'effort_engagement_score': 0.2,
        'collaboration_communication_score': 0.2,
        'adaptability_growth_score': 0.15,
        'integrity_feedback_score': 0.15,
        'historical_progress_score': 0.15,
        'leadership_score': 0.15
    }, row)

def burnout_risk(row):
    try:
        hours = float(row.get('avg_hours_logged_vs_team', 3)) if row.get('avg_hours_logged_vs_team') is not None else 3
    except:
        hours = 3
    try:
        effort = float(row.get('effort_engagement_score', 3)) if row.get('effort_engagement_score') is not None else 3
    except:
        effort = 3

    peer_reviews_text = str(row.get('peer_reviews', '')) if row.get('peer_reviews') is not None else ''
    sentiment = TextBlob(peer_reviews_text).sentiment.polarity
    sentiment_score = 1 if sentiment > 0.4 else 2 if sentiment > 0.1 else 3 if sentiment > -0.1 else 4 if sentiment > -0.4 else 5

    return min(5, max(1, round(0.4 * hours + 0.3 * (6 - effort) + 0.3 * sentiment_score)))

def voluntary_contributions(row):
    fields = ['hackathon_participation', 'innovation_submissions', 'knowledge_contributions']
    # Assuming these fields store boolean-like values or numbers that can be interpreted as presence/absence
    # Convert to boolean for count: True for non-empty/non-zero, False otherwise
    return min(5, sum([bool(row.get(f)) for f in fields if row.get(f) is not None and str(row.get(f)).strip() != '']) + 1)


def stress_load_tolerance(row):
    try:
        br = float(row.get('burnout_risk', 3)) if row.get('burnout_risk') is not None else 3
    except:
        br = 3
    return 6 - br

def promotion_recommendation(row):
    score = safe_weighted_avg({'effort_engagement_score': 0.3, 'overall_weighted_score': 0.5, 'task_ownership': 0.2}, row)

    try:
        delta = float(row.get('score_delta', 0)) if row.get('score_delta') is not None else 0
    except:
        delta = 0
    try:
        promotions = int(row.get('promotions_achieved', 0)) if row.get('promotions_achieved') is not None else 0
    except:
        promotions = 0

    return int(score >= 3 and delta >= 0) if promotions >= 1 else int(score >= 4 and delta >= 0.3)

def retention_suggestion(row):
    try:
        burnout = float(row.get('burnout_risk', 0)) if row.get('burnout_risk') is not None else 0
    except:
        burnout = 0
    try:
        tenure = float(row.get('tenure_in_current_role', 10)) if row.get('tenure_in_current_role') is not None else 10
    except:
        tenure = 10
    peer_reviews_text = str(row.get('peer_reviews', '')) if row.get('peer_reviews') is not None else ''
    sentiment = TextBlob(peer_reviews_text).sentiment.polarity

    return int(burnout >= 4 and tenure < 2 and sentiment < 0)

def skill_development_score(row):
    return safe_weighted_avg({'certifications_completed': 0.4, 'online_courses_attended': 0.3, 'training_hours_logged': 0.3}, row)

def work_quality_consistency(row):
    return safe_weighted_avg({'code_quality': 0.5, 'peer_review_rating': 0.5}, row)

def adherence_to_deadlines(row):
    return safe_weighted_avg({'roadmap_adherence': 0.6, 'report_timeliness': 0.4}, row)


def compute_all_derived_kpis(row):
    # Ensure numerical values are treated as such before calculation
    # And handle potential missing keys gracefully by providing default values for computations

    # Convert relevant fields to numeric, setting to None or default if not convertible
    numeric_fields = [
        'tenure_in_current_role', 'past_roles_held', 'total_experience', 'avg_hours_logged_vs_team',
        'task_completion_ratio', 'active_workdays', 'burnout_risk', 'responsiveness',
        'meeting_participation', 'task_ownership', 'adherence_to_deadlines',
        'work_quality_consistency', 'conversion_rate', 'revenue_generated',
        'upsell_opportunities_closed', 'client_retention_rate', 'crm_followup_consistency',
        'code_commits', 'bug_fix_count', 'sprint_velocity', 'deployment_frequency',
        'code_quality', 'model_accuracy', 'feature_engineering', 'experiment_reproducibility',
        'model_deployment_count', 'tech_debt_reduction', 'positions_filled',
        'onboarding_satisfaction', 'training_sessions_delivered', 'employee_engagement_score',
        'policy_compliance_x', 'policy_compliance_y', 'feature_delivery_timeliness', 'roadmap_adherence',
        'cross_team_coordination', 'sprint_success_rate', 'stakeholder_ratings',
        'ledger_accuracy', 'compliance_adherence', 'invoice_processing_efficiency',
        'audit_readiness_score', 'report_submission_punctuality', 'campaign_reach',
        'leads_generated', 'social_engagement_rate', 'seo_improvement',
        'content_delivery_timeliness', 'test_cases_executed', 'bugs_reported',
        'automation_coverage', 'regression_pass_rate', 'defect_leakage_rate',
        'budget_forecasting_accuracy', 'variance_analysis_score', 'report_timeliness',
        'cost_saving_suggestions', 'financial_modeling_score', 'uptime_percentage',
        'mttr', 'successful_deployments', 'cicd_pipeline_efficiency', 'incident_response_time',
        'design_delivery_timeliness', 'usability_test_score', 'rework_count',
        'visual_consistency', 'accessibility_score', 'reports_delivered', 'insight_accuracy',
        'query_efficiency', 'dashboard_usage_rate', 'data_quality_score',
        'certifications_completed', 'online_courses_attended', 'training_hours_logged',
        'knowledge_contributions', 'hackathon_participation', 'innovation_submissions',
        'peer_review_rating', 'manager_feedback', 'meeting_participation_rate',
        'communication_effectiveness', 'conflict_resolution', 'mentorship_participation',
        'client_communication', 'response_to_change', 'initiative_in_projects',
        'adaptability_to_change', 'promotion_recommendation', 'retention_suggestion',
        'leadership_score', 'stress_load_tolerance', 'special_recognitions',
        'hr_warnings', 'peer_complaints', 'recognition_received',
        'ethics_confidentiality', 'total_experience_score', 'internal_transfers',
        'promotions_achieved', 'projects_handled', 'score_delta'
    ]

    for field in numeric_fields:
        if field in row and row[field] is not None:
            try:
                row[field] = float(row[field])
            except (ValueError, TypeError):
                row[field] = np.nan # Use NaN for non-numeric values for calculations

    # Now compute derived KPIs
    row['communication_effectiveness'] = communication_effectiveness(row)
    row['responsiveness'] = responsiveness(row)
    row['meeting_participation'] = meeting_participation(row)
    row['effort_engagement_score'] = effort_engagement_score(row)
    row['adaptability_growth_score'] = adaptability_growth_score(row)
    row['integrity_feedback_score'] = integrity_feedback_score(row)
    row['historical_progress_score'] = historical_progress_score(row)
    row['collaboration_communication_score'] = collaboration_communication_score(row)
    row['task_ownership'] = task_ownership(row)
    row['leadership_score'] = leadership_score(row)
    row['overall_weighted_score'] = overall_weighted_score(row)
    row['burnout_risk'] = burnout_risk(row)
    row['voluntary_contributions'] = voluntary_contributions(row)
    row['stress_load_tolerance'] = stress_load_tolerance(row)
    row['promotion_recommendation'] = promotion_recommendation(row)
    row['retention_suggestion'] = retention_suggestion(row)
    row['skill_development_score'] = skill_development_score(row)
    row['work_quality_consistency'] = work_quality_consistency(row)
    row['adherence_to_deadlines'] = adherence_to_deadlines(row)
    return row


if __name__ == '__main__':
    app.run(debug=True)