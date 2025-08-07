import pandas as pd
import numpy as np
import re
from textblob import TextBlob
from sklearn.preprocessing import StandardScaler, MinMaxScaler, OneHotEncoder

def preprocess_data(df):
    df = df.copy()

    # Column classifications
    categorical_cols = [
        'department', 'designation', 'work_location', 'reporting_manager', 
        'employment_type', 'special_recognitions', 'hr_warnings', 
        'recognition_received', 'internal_transfers'
    ]

    numeric_cols = [
        'tenure_in_current_role', 'avg_hours_logged_vs_team', 'task_completion_ratio',
        'active_workdays', 'voluntary_contributions', 'burnout_risk', 'responsiveness',
        'meeting_participation', 'task_ownership', 'adherence_to_deadlines',
        'work_quality_consistency', 'code_commits', 'bug_fix_count', 'sprint_velocity',
        'deployment_frequency', 'test_cases_executed', 'bugs_reported',
        'automation_coverage', 'regression_pass_rate', 'defect_leakage_rate',
        'model_accuracy', 'model_deployment_count', 'tech_debt_reduction',
        'positions_filled', 'onboarding_satisfaction', 'training_sessions_delivered',
        'employee_engagement_score', 'feature_delivery_timeliness', 'roadmap_adherence',
        'sprint_success_rate', 'reports_delivered', 'insight_accuracy', 'query_efficiency',
        'dashboard_usage_rate', 'conversion_rate', 'revenue_generated',
        'client_retention_rate', 'uptime_percentage', 'mttr', 'successful_deployments',
        'incident_response_time', 'budget_forecasting_accuracy', 'variance_analysis_score',
        'cost_saving_suggestions', 'campaign_reach', 'leads_generated',
        'social_engagement_rate', 'design_delivery_timeliness', 'usability_test_score',
        'rework_count', 'accessibility_score', 'ledger_accuracy', 'compliance_adherence',
        'audit_readiness_score', 'certifications_completed', 'online_courses_attended',
        'training_hours_logged', 'hackathon_participation', 'peer_review_rating',
        'meeting_participation_rate', 'communication_effectiveness', 'promotion_recommendation',
        'retention_suggestion', 'leadership_score', 'stress_load_tolerance',
        'total_experience_score', 'promotions_achieved', 'projects_handled', 'score_delta',
        'effort_engagement_score', 'role_specific_kpi_score', 'skill_development_score',
        'collaboration_communication_score', 'adaptability_growth_score',
        'integrity_feedback_score', 'historical_progress_score'
    ]

    text_cols = ['manager_comments', 'hr_notes', 'peer_reviews', 'client_feedback']
    date_cols = ['date_of_joining']
    id_cols = ['employee_id', 'name']

    # Text feedback scoring
    def process_text(text):
        if pd.isna(text): return 0
        try:
            sentiment = TextBlob(str(text)).sentiment.polarity
            length = len(str(text))
            positive_words = len(re.findall(r'(good|excellent|great|outstanding)', str(text).lower()))
            negative_words = len(re.findall(r'(poor|bad|weak|concern)', str(text).lower()))
            return (sentiment + 1) * 2.5 + (length / 100) + positive_words - negative_words
        except:
            return 0

    for col in text_cols:
        df[f'{col}_score'] = df[col].apply(process_text)

    if 'date_of_joining' in df.columns:
        df['date_of_joining'] = pd.to_datetime(df['date_of_joining'], errors='coerce')
        df['days_since_joining'] = (pd.Timestamp.now() - df['date_of_joining']).dt.days
        df['joining_month'] = df['date_of_joining'].dt.month
        df['joining_quarter'] = df['date_of_joining'].dt.quarter

    if 'past_roles_held' in df.columns:
        df['num_past_roles'] = df['past_roles_held'].fillna('').astype(str).str.split(',').apply(lambda x: len(x) if isinstance(x, list) else 0)

    flag_cols = ['hr_warnings', 'peer_complaints', 'recognition_received', 'special_recognitions']
    for col in flag_cols:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: 1 if str(x).lower() in ['yes', 'true', '1'] else 0)

    percent_cols = [col for col in df.columns if '_rate' in col or '_percentage' in col or 'ratio' in col]
    for col in percent_cols:
        if col in df.columns:
            df[col] = df[col].replace('[\\%,]', '', regex=True).astype(float) / 100

    score_cols = [col for col in df.columns if '_score' in col]
    for col in score_cols:
        if col in df.columns and df[col].max() > 5:
            df[col] = df[col] / 10

    if all(col in df.columns for col in ['code_commits', 'bug_fix_count']):
        df['developer_productivity'] = df['code_commits'] * 0.7 + df['bug_fix_count'] * 0.3

    if all(col in df.columns for col in ['test_cases_executed', 'bugs_reported']):
        df['qa_effectiveness'] = df['test_cases_executed'] * 0.6 + df['bugs_reported'] * 0.4

    if 'tenure_in_current_role' in df.columns:
        df['tenure_bucket'] = pd.cut(df['tenure_in_current_role'],
                                     bins=[0, 6, 12, 24, 60, np.inf],
                                     labels=['0-6m', '6-12m', '1-2y', '2-5y', '5y+'])

    # No imputation — retain missing values
    scaler = MinMaxScaler(feature_range=(0, 5))
    robust_scaler_cols = ['revenue_generated', 'code_commits', 'projects_handled']

    for col in numeric_cols:
        if col in df.columns:
            not_null_mask = df[col].notnull()
            try:
                if col in robust_scaler_cols:
                    standard_scaled = StandardScaler().fit_transform(df.loc[not_null_mask, [col]])
                    df[col] = df[col].astype(float)
                    df.loc[not_null_mask, col] = MinMaxScaler(feature_range=(0, 5)).fit_transform(standard_scaled).ravel()

                else:
                    df[col] = df[col].astype(float)  # Ensure dtype is float
                    df.loc[not_null_mask, col] = scaler.fit_transform(df.loc[not_null_mask, [col]]).ravel()

                    
            except Exception as e:
                print(f"Skipping scaling for {col} due to error: {e}")

    # One-hot encoding
    encoder = OneHotEncoder(handle_unknown='ignore', sparse_output=False)
    existing_categorical = [col for col in categorical_cols if col in df.columns]
    encoded_data = encoder.fit_transform(df[existing_categorical])
    encoded_cols = encoder.get_feature_names_out(existing_categorical)
    encoded_df = pd.DataFrame(encoded_data, columns=encoded_cols, index=df.index)
    df = df.drop(existing_categorical, axis=1)
    df = pd.concat([df, encoded_df], axis=1)

    # Drop text, ID, and date columns
    df.drop(columns=[col for col in id_cols + text_cols + date_cols if col in df.columns], inplace=True)
    df = df.replace([np.inf, -np.inf], np.nan)

    return df

# === Usage ===
if __name__ == "__main__":
    df = pd.read_csv("evalmate_logic_weighted.csv")
    processed_df = preprocess_data(df)
    processed_df.to_csv("preprocessed_dataset.csv", index=False)
    print("✅ Preprocessing complete (0–5 scale, missing values retained) and saved as preprocessed_dataset.csv")

