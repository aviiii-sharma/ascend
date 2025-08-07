+import pandas as pd
import numpy as np
from textblob import TextBlob
from collections import defaultdict

# Load dataset
df = pd.read_csv("evalmate_complete_dataset.csv")

# --- Utility Function ---
def safe_weighted_avg(components, row):
    values = np.array([row.get(col, np.nan) for col in components])
    weights = np.array(list(components.values()))
    mask = ~np.isnan(values)
    if mask.sum() == 0:
        return 3
    return round(np.average(values[mask], weights=weights[mask]))

# --- Logic Functions ---
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
    return safe_weighted_avg({'policy_compliance_x': 0.4, 'ethics_confidentiality': 0.3, 'policy_compliance_y': 0.3}, row)

def historical_progress_score(row):
    return safe_weighted_avg({'score_delta': 0.4, 'past_roles_held': 0.3, 'promotions_achieved': 0.3}, row)

def collaboration_communication_score(row):
    return safe_weighted_avg({'communication_effectiveness': 0.3, 'peer_review_rating': 0.3, 'conflict_resolution': 0.2, 'cross_team_coordination': 0.2}, row)

def task_ownership(row):
    init = row.get('initiative_in_projects', 3)
    delta = row.get('score_delta', 0)
    return 5 if init >= 4 and delta >= 0.5 else 4 if init >= 3.5 else 3 if init >= 2.5 else 2 if init >= 1.5 else 1

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
    hours = row.get('avg_hours_logged_vs_team', 3)
    effort = row.get('effort_engagement_score', 3)
    sentiment = TextBlob(str(row.get('peer_reviews', ''))).sentiment.polarity
    sentiment_score = 1 if sentiment > 0.4 else 2 if sentiment > 0.1 else 3 if sentiment > -0.1 else 4 if sentiment > -0.4 else 5
    return min(5, max(1, round(0.4 * hours + 0.3 * (6 - effort) + 0.3 * sentiment_score)))

def voluntary_contributions(row):
    fields = ['hackathon_participation', 'innovation_submissions', 'knowledge_contributions']
    return min(5, np.sum([row.get(f, 0) > 0 for f in fields]) + 1)

def stress_load_tolerance(row):
    return 6 - row.get('burnout_risk', 3)

def promotion_recommendation(row):
    score = safe_weighted_avg({'effort_engagement_score': 0.3, 'overall_weighted_score': 0.5, 'task_ownership': 0.2}, row)
    delta = row.get('score_delta', 0)
    promotions = row.get('promotions_achieved', 0)
    return int(score >= 3 and delta >= 0) if promotions >= 1 else int(score >= 4 and delta >= 0.3)

def retention_suggestion(row):
    sentiment = TextBlob(str(row.get('peer_reviews', ''))).sentiment.polarity
    return int(row.get('burnout_risk', 0) >= 4 and row.get('tenure_in_current_role', 10) < 2 and sentiment < 0)

def skill_development_score(row):
    return safe_weighted_avg({'certifications_completed': 0.4, 'online_courses_attended': 0.3, 'training_hours_logged': 0.3}, row)

def work_quality_consistency(row):
    return safe_weighted_avg({'code_quality': 0.5, 'peer_review_rating': 0.5}, row)

def adherence_to_deadlines(row):
    return safe_weighted_avg({'roadmap_adherence': 0.6, 'report_timeliness': 0.4}, row)

def bug_fix_count(row):
    return safe_weighted_avg({'bugs_reported': 0.4, 'code_commits': 0.3, 'sprint_velocity': 0.3}, row)

def feature_engineering(row):
    return safe_weighted_avg({'innovation_submissions': 0.4, 'model_accuracy': 0.3, 'projects_handled': 0.3}, row)

def model_deployment_count(row):
    return safe_weighted_avg({'model_accuracy': 0.4, 'experiment_reproducibility': 0.3, 'successful_deployments': 0.3}, row)

def audit_readiness_score(row):
    return safe_weighted_avg({'policy_compliance_x': 0.35, 'policy_compliance_y': 0.35, 'report_submission_punctuality': 0.3}, row)

def code_commits(row):
    return safe_weighted_avg({'sprint_velocity': 0.4, 'feature_delivery_timeliness': 0.3, 'deployment_frequency': 0.3}, row)

def regression_pass_rate(row):
    return safe_weighted_avg({'test_cases_executed': 0.6, 'bugs_reported': 0.4}, row)

def defect_leakage_rate(row):
    bugs = row.get('bugs_reported', 1)
    tested = row.get('test_cases_executed', 1)
    passed = row.get('regression_pass_rate', 3)
    try:
        ratio = (tested + passed) / (bugs + 1)
        return int(np.clip(5 - round(ratio), 1, 5))
    except:
        return 3

def seo_improvement(row):
    return safe_weighted_avg({'content_delivery_timeliness': 0.4, 'social_engagement_rate': 0.3, 'leads_generated': 0.3}, row)

def visual_consistency(row):
    return safe_weighted_avg({'usability_test_score': 0.4, 'design_delivery_timeliness': 0.3, 'accessibility_score': 0.3}, row)

# --- KPI Function Registry ---
logic_functions = {
    'communication_effectiveness': communication_effectiveness,
    'responsiveness': responsiveness,
    'meeting_participation': meeting_participation,
    'effort_engagement_score': effort_engagement_score,
    'adaptability_growth_score': adaptability_growth_score,
    'integrity_feedback_score': integrity_feedback_score,
    'historical_progress_score': historical_progress_score,
    'collaboration_communication_score': collaboration_communication_score,
    'task_ownership': task_ownership,
    'leadership_score': leadership_score,
    'overall_weighted_score': overall_weighted_score,
    'burnout_risk': burnout_risk,
    'voluntary_contributions': voluntary_contributions,
    'stress_load_tolerance': stress_load_tolerance,
    'promotion_recommendation': promotion_recommendation,
    'retention_suggestion': retention_suggestion,
    'skill_development_score': skill_development_score,
    'work_quality_consistency': work_quality_consistency,
    'adherence_to_deadlines': adherence_to_deadlines,
    'bug_fix_count': bug_fix_count,
    'feature_engineering': feature_engineering,
    'model_deployment_count': model_deployment_count,
    'audit_readiness_score': audit_readiness_score,
    'code_commits': code_commits,
    'regression_pass_rate': regression_pass_rate,
    'defect_leakage_rate': defect_leakage_rate,
    'seo_improvement': seo_improvement,
    'visual_consistency': visual_consistency
}

# --- Role-to-KPI Mapping ---
role_kpi_pairs = [
    ("Software Developer", "code_commits"), ("Software Developer", "bug_fix_count"),
    ("Software Developer", "sprint_velocity"), ("Software Developer", "deployment_frequency"),
    ("Software Developer", "code_quality"), ("QA Tester", "test_cases_executed"),
    ("QA Tester", "bugs_reported"), ("QA Tester", "automation_coverage"),
    ("QA Tester", "regression_pass_rate"), ("QA Tester", "defect_leakage_rate"),
    ("HR Executive", "positions_filled"), ("HR Executive", "onboarding_satisfaction"),
    ("HR Executive", "training_sessions_delivered"), ("HR Executive", "employee_engagement_score"),
    ("HR Executive", "policy_compliance"), ("Sales Executive", "conversion_rate"),
    ("Sales Executive", "revenue_generated"), ("Sales Executive", "upsell_opportunities_closed"),
    ("Sales Executive", "client_retention_rate"), ("Sales Executive", "crm_followup_consistency"),
    ("Marketing Specialist", "campaign_reach"), ("Marketing Specialist", "leads_generated"),
    ("Marketing Specialist", "social_engagement_rate"), ("Marketing Specialist", "seo_improvement"),
    ("Marketing Specialist", "content_delivery_timeliness"), ("Product Manager", "feature_delivery_timeliness"),
    ("Product Manager", "roadmap_adherence"), ("Product Manager", "cross_team_coordination"),
    ("Product Manager", "sprint_success_rate"), ("Product Manager", "stakeholder_ratings"),
    ("UI/UX Designer", "design_delivery_timeliness"), ("UI/UX Designer", "usability_test_score"),
    ("UI/UX Designer", "rework_count"), ("UI/UX Designer", "visual_consistency"),
    ("UI/UX Designer", "accessibility_score"), ("DevOps Engineer", "uptime_percentage"),
    ("DevOps Engineer", "mttr"), ("DevOps Engineer", "successful_deployments"),
    ("DevOps Engineer", "cicd_pipeline_efficiency"), ("DevOps Engineer", "incident_response_time"),
    ("Data Analyst", "reports_delivered"), ("Data Analyst", "insight_accuracy"),
    ("Data Analyst", "query_efficiency"), ("Data Analyst", "dashboard_usage_rate"),
    ("Data Analyst", "data_quality_score"), ("AI/ML Engineer", "model_accuracy"),
    ("AI/ML Engineer", "feature_engineering"), ("AI/ML Engineer", "experiment_reproducibility"),
    ("AI/ML Engineer", "model_deployment_count"), ("AI/ML Engineer", "tech_debt_reduction"),
    ("Financial Analyst", "budget_forecasting_accuracy"), ("Financial Analyst", "variance_analysis_score"),
    ("Financial Analyst", "report_timeliness"), ("Financial Analyst", "cost_saving_suggestions"),
    ("Financial Analyst", "financial_modeling_score"), ("Accountant", "ledger_accuracy"),
    ("Accountant", "compliance_adherence"), ("Accountant", "invoice_processing_efficiency"),
    ("Accountant", "audit_readiness_score"), ("Accountant", "report_submission_punctuality")
]

# Build KPI-to-role map
kpi_to_roles = defaultdict(list)
for role, kpi in role_kpi_pairs:
    kpi_to_roles[kpi].append(role)

# --- Apply Logic with Role Filtering ---
for kpi, func in logic_functions.items():
    if kpi in kpi_to_roles:
        roles = kpi_to_roles[kpi]
        df[kpi] = df.apply(lambda row: func(row) if row.get('designation') in roles else np.nan, axis=1)
    else:
        df[kpi] = df.apply(func, axis=1)

# --- Save Result ---
df.to_csv("evalmate_logic_weighted.csv", index=False)
print("✅ Logic applied with role-based filtering. Output saved.")
