import pandas as pd
from pymongo import MongoClient
import numpy as np # For handling NaN values

# MongoDB Configuration (match these with your app.py if you changed them)
MONGO_URI = 'mongodb://localhost:27017/'
DB_NAME = 'EvalMate'
EMPLOYEES_COLLECTION = 'employees'

# Path to your existing CSV file
CSV_FILE_PATH = './uploads/newskeleton.csv' # Adjust if your file is elsewhere

def import_csv_data():
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        employees_collection = db[EMPLOYEES_COLLECTION]

        # Read CSV into pandas DataFrame
        df = pd.read_csv(CSV_FILE_PATH)

        # Handle NaN values: MongoDB does not store NaN, convert to None
        df = df.replace({np.nan: None})

        # Convert DataFrame to a list of dictionaries (MongoDB documents)
        data_to_insert = df.to_dict(orient='records')

        # Insert or update records based on 'employee_id'
        # This will ensure that if you run it multiple times, it updates existing records
        # rather than creating duplicates if 'employee_id' is unique.
        print(f"Attempting to import {len(data_to_insert)} records...")
        inserted_count = 0
        updated_count = 0
        for record in data_to_insert:
            employee_id = record.get('employee_id')
            if employee_id:
                result = employees_collection.update_one(
                    {'employee_id': employee_id},
                    {'$set': record},
                    upsert=True
                )
                if result.upserted_id:
                    inserted_count += 1
                elif result.matched_count > 0:
                    updated_count += 1
            else:
                # If no employee_id, just insert as new (consider if this is desired)
                employees_collection.insert_one(record)
                inserted_count += 1
        
        print(f"Import complete. Inserted: {inserted_count} new records, Updated: {updated_count} existing records.")

    except FileNotFoundError:
        print(f"Error: CSV file not found at {CSV_FILE_PATH}")
    except Exception as e:
        print(f"An error occurred during import: {e}")
    finally:
        if 'client' in locals() and client:
            client.close()

if __name__ == "__main__":
    import_csv_data()