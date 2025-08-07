# create_user.py (MODIFIED)

from pymongo import MongoClient
from flask_bcrypt import Bcrypt
import os
from dotenv import load_dotenv

def create_user_in_db(email, password, name, role, employee_id):
    """Adds a new user to a role-specific collection."""
    bcrypt = Bcrypt()
    
    load_dotenv()
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    DB_NAME = 'hr_data'

    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    
    # --- START: MODIFIED LOGIC ---
    # Define a map from role to collection name
    collection_map = {
        "HR": "hr_users",
        "Manager": "manager_users",
        "Employee": "employee_users"
    }
    
    # Get the correct collection name, or default to 'employees' if role is unknown
    collection_name = collection_map.get(role, 'employees')
    collection = db[collection_name]
    # --- END: MODIFIED LOGIC ---
    
    if collection.find_one({"email": email}):
        print(f"⚠️  User with email {email} already exists in '{collection_name}'. No action taken.")
        client.close()
        return

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
    
    user_document = {
        "employee_id": employee_id,
        "email": email,
        "password": hashed_password,
        "name": name,
        "role": role,
    }
    
    collection.insert_one(user_document)
    print(f"✅ User '{name}' created successfully in collection: '{collection_name}'")
    client.close()


# --- Main execution remains the same ---
if __name__ == "__main__":
    # Before running, you may want to delete the existing users from the 'employees' collection
    # to avoid duplicates.
    print("--- Creating EvalMate Users in Separate Collections ---")
    create_user_in_db("hr.admin@evalmate.com", "PasswordHR123!", "Alex Chen", "HR", "TL0001")
    create_user_in_db("manager.ryan@evalmate.com", "PasswordManager456!", "Ryan Miller", "Manager", "TL0002")
    create_user_in_db("employee.mike@evalmate.com", "PasswordEmployee789!", "Mike Davis", "Employee", "TL0003")
    print("--- User creation process finished ---")