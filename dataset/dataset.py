import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
from faker import Faker
import json

# Initialize Faker for generating realistic names and data
fake = Faker()
np.random.seed(42)
random.seed(42)

class EvalMateDatasetGenerator:
    def __init__(self, num_employees=10000):
        self.num_employees = num_employees
        self.departments = ['Engineering', 'Product', 'Marketing', 'Sales', 'HR', 'Operations', 'Design', 'Finance']
        self.designations = {
            'Software Developer': 'Engineering',
            'QA Tester': 'Engineering',
            'HR Executive': 'HR',
            'Sales Executive': 'Sales',
            'Marketing Specialist': 'Marketing',
            'Product Manager': 'Product',
            'UI/UX Designer': 'Design',
            'DevOps Engineer': 'Engineering',
            'Data Analyst': 'Engineering',
            'AI/ML Engineer': 'Engineering',
            'Financial Analyst': 'Finance',
            'Accountant': 'Finance'
        }
        self.work_locations = ['On-site', 'Remote', 'Hybrid']
        self.employment_types = ['Full-Time', 'Contract', 'Intern']

        # Role-specific KPIs mapping
        self.role_kpis = {
            'Software Developer': {
                'code_commits': 'Code Commits',
                'bug_fix_count': 'Bug Fix Count',
                'sprint_velocity': 'Sprint Velocity',
                'deployment_frequency': 'Deployment Frequency',
                'code_quality': 'Code Quality'
            },
            'QA Tester': {
                'test_cases_executed': 'Test Cases Executed',
                'bugs_reported': 'Bugs Reported',
                'automation_coverage': 'Automation Coverage',
                'regression_pass_rate': 'Regression Pass %',
                'defect_leakage_rate': 'Defect Leakage Rate'
            },
            'HR Executive': {
                'positions_filled': 'Positions Filled',
                'onboarding_satisfaction': 'Onboarding Satisfaction',
                'training_sessions_delivered': 'Training Sessions Delivered',
                'employee_engagement_score': 'Employee Engagement Score',
                'policy_compliance': 'Policy Compliance'
            },
            'Sales Executive': {
                'conversion_rate': 'Conversion Rate',
                'revenue_generated': 'Revenue Generated',
                'upsell_opportunities_closed': 'Upsell Opportunities Closed',
                'client_retention_rate': 'Client Retention Rate',
                'crm_followup_consistency': 'CRM Follow-Up Consistency'
            },
            'Marketing Specialist': {
                'campaign_reach': 'Campaign Reach',
                'leads_generated': 'Leads Generated',
                'social_engagement_rate': 'Social Engagement Rate',
                'seo_improvement': 'SEO Improvement',
                'content_delivery_timeliness': 'Content Delivery Timeliness'
            },
            'Product Manager': {
                'feature_delivery_timeliness': 'Feature Delivery Timeliness',
                'roadmap_adherence': 'Roadmap Adherence',
                'cross_team_coordination': 'Cross-Team Coordination',
                'sprint_success_rate': 'Sprint Success Rate',
                'stakeholder_ratings': 'Stakeholder Ratings'
            },
            'UI/UX Designer': {
                'design_delivery_timeliness': 'Design Delivery Timeliness',
                'usability_test_score': 'Usability Test Score',
                'rework_count': 'Rework Count',
                'visual_consistency': 'Visual Consistency',
                'accessibility_score': 'Accessibility Score'
            },
            'DevOps Engineer': {
                'uptime_percentage': 'Uptime %',
                'mttr': 'MTTR',
                'successful_deployments': 'Successful Deployments',
                'cicd_pipeline_efficiency': 'CI/CD Pipeline Efficiency',
                'incident_response_time': 'Incident Response Time'
            },
            'Data Analyst': {
                'reports_delivered': 'Reports Delivered',
                'insight_accuracy': 'Insight Accuracy',
                'query_efficiency': 'Query Efficiency',
                'dashboard_usage_rate': 'Dashboard Usage Rate',
                'data_quality_score': 'Data Quality Score'
            },
            'AI/ML Engineer': {
                'model_accuracy': 'Model Accuracy',
                'feature_engineering': 'Feature Engineering',
                'experiment_reproducibility': 'Experiment Reproducibility',
                'model_deployment_count': 'Model Deployment Count',
                'tech_debt_reduction': 'Tech Debt Reduction'
            },
            'Financial Analyst': {
                'budget_forecasting_accuracy': 'Budget Forecasting Accuracy',
                'variance_analysis_score': 'Variance Analysis Score',
                'report_timeliness': 'Report Timeliness',
                'cost_saving_suggestions': 'Cost Saving Suggestions',
                'financial_modeling_score': 'Financial Modeling Score'
            },
            'Accountant': {
                'ledger_accuracy': 'Ledger Accuracy',
                'compliance_adherence': 'Compliance Adherence',
                'invoice_processing_efficiency': 'Invoice Processing Efficiency',
                'audit_readiness_score': 'Audit Readiness Score',
                'report_submission_punctuality': 'Report Submission Punctuality'
            }
        }

        # Enhanced feedback templates with dynamic components
        self.feedback_templates = {
            'performance_adjectives': {
                'excellent': ['outstanding', 'exceptional', 'exemplary', 'remarkable', 'superior'],
                'good': ['solid', 'competent', 'reliable', 'consistent', 'dependable'],
                'average': ['adequate', 'satisfactory', 'acceptable', 'standard', 'typical'],
                'poor': ['inconsistent', 'below expectations', 'needs improvement', 'lacking', 'subpar']
            },
            'strengths': {
                'technical': ['strong technical skills', 'excellent problem-solving abilities', 'innovative thinking', 
                            'attention to detail', 'code quality', 'system design expertise'],
                'communication': ['clear communication', 'excellent presentation skills', 'active listening', 
                               'effective documentation', 'stakeholder management'],
                'collaboration': ['team player', 'mentoring abilities', 'cross-functional collaboration', 
                                'conflict resolution', 'knowledge sharing'],
                'leadership': ['takes initiative', 'leads by example', 'strategic thinking', 
                             'decision-making', 'team motivation']
            },
            'improvement_areas': {
                'technical': ['needs to stay updated with latest technologies', 'could improve testing practices', 
                            'requires better error handling', 'needs to focus on performance optimization'],
                'communication': ['could improve written communication', 'needs to speak up more in meetings', 
                               'should provide clearer status updates', 'needs better client communication'],
                'time_management': ['struggles with deadline management', 'needs better prioritization', 
                                  'could improve estimation skills', 'requires better planning'],
                'collaboration': ['needs to be more proactive in team discussions', 'could improve peer collaboration', 
                                'should participate more in team activities']
            },
            'achievements': {
                'project': ['successfully delivered critical project', 'led migration to new system', 
                          'implemented cost-saving solution', 'reduced processing time significantly'],
                'recognition': ['received client appreciation', 'got employee of the month', 
                              'recognized for innovation', 'praised for quick problem resolution'],
                'learning': ['completed certification program', 'acquired new technical skills', 
                           'participated in training sessions', 'contributed to knowledge base']
            },
            'development_suggestions': {
                'technical': ['recommend advanced training in specific technologies', 
                            'suggest attending technical conferences', 'could benefit from code review sessions'],
                'soft_skills': ['recommend leadership training', 'suggest communication workshops', 
                              'could benefit from project management training'],
                'career': ['ready for increased responsibilities', 'consider for promotion track', 
                         'suitable for mentoring junior team members']
            }
        }

    def generate_employee_basic_info(self):
        """Generate basic employee information"""
        employees = []
        
        # Generate a pool of managers (approximately 1 manager per 20 employees)
        num_managers = max(1, self.num_employees // 20)
        managers_pool = []
        
        # Create managers for each department
        for dept in self.departments:
            dept_managers = max(1, num_managers // len(self.departments))
            for _ in range(dept_managers):
                managers_pool.append({
                    'name': fake.name(),
                    'department': dept
                })
        
        # Add some additional managers if needed
        while len(managers_pool) < num_managers:
            managers_pool.append({
                'name': fake.name(),
                'department': random.choice(self.departments)
            })
        
        for i in range(self.num_employees):
            designation = random.choice(list(self.designations.keys()))
            department = self.designations[designation]

            join_date = fake.date_between(start_date='-5y', end_date='today')
            tenure_days = (datetime.now().date() - join_date).days
            tenure_years = round(tenure_days / 365.25, 1)
            
            # Assign manager from the same department (preferred) or any department
            dept_managers = [m for m in managers_pool if m['department'] == department]
            if dept_managers:
                assigned_manager = random.choice(dept_managers)['name']
            else:
                assigned_manager = random.choice(managers_pool)['name']
            
            employee = {
                'employee_id': f'EMP{str(i+1).zfill(4)}',
                'name': fake.name(),
                'department': department,
                'designation': designation,
                'date_of_joining': join_date,
                'work_location': random.choice(self.work_locations),
                'reporting_manager': assigned_manager,
                'employment_type': random.choice(self.employment_types),
                'tenure_in_current_role': tenure_years,
                'past_roles_held': random.randint(0, 3),
                'total_experience': round(tenure_years + random.uniform(0, 5), 1)
            }
            employees.append(employee)
        
        return employees
    
    def generate_effort_engagement_scores(self):
        """Generate Effort & Engagement category scores"""
        scores = []
        
        for i in range(self.num_employees):
            # Correlated scores with some randomness
            base_performance = random.uniform(2.5, 4.5)
            
            score = {
                'employee_id': f'EMP{str(i+1).zfill(4)}',
                'avg_hours_logged_vs_team': max(1, min(5, int(np.random.normal(base_performance, 0.8)))),
                'task_completion_ratio': max(1, min(5, int(np.random.normal(base_performance, 0.6)))),
                'active_workdays': max(1, min(5, int(np.random.normal(base_performance, 0.7)))),
                'voluntary_contributions': random.choices([1, 3, 5], weights=[0.4, 0.4, 0.2])[0],
                'burnout_risk': random.choices([1, 3, 5], weights=[0.1, 0.3, 0.6])[0],
                'responsiveness': max(1, min(5, int(np.random.normal(base_performance, 0.5)))),
                'meeting_participation': random.choices([1, 3, 5], weights=[0.2, 0.5, 0.3])[0],
                'task_ownership': max(1, min(5, int(np.random.normal(base_performance, 0.7)))),
                'adherence_to_deadlines': max(1, min(5, int(np.random.normal(base_performance, 0.6)))),
                'work_quality_consistency': max(1, min(5, int(np.random.normal(base_performance, 0.5))))
            }
            scores.append(score)
        
        return scores
    
    def generate_role_specific_kpis(self, employees_data):
        """Generate role-specific KPI scores based on employee designations"""
        kpi_scores = []
        
        for i, employee in enumerate(employees_data):
            emp_id = employee['employee_id']
            designation = employee['designation']
            base_performance = random.uniform(2.5, 4.5)
            
            # Initialize with employee_id
            score = {'employee_id': emp_id}
            
            # Get role-specific KPIs or use generic ones
            if designation in self.role_kpis:
                role_kpis = self.role_kpis[designation]
                for kpi_key, kpi_name in role_kpis.items():
                    # Generate score based on KPI type
                    if 'rate' in kpi_key.lower() or 'percentage' in kpi_key.lower() or 'accuracy' in kpi_key.lower():
                        # For percentage/rate metrics, use higher base scores
                        score[kpi_key] = max(1, min(5, int(np.random.normal(base_performance + 0.3, 0.6))))
                    elif 'count' in kpi_key.lower() or 'frequency' in kpi_key.lower():
                        # For count/frequency metrics
                        score[kpi_key] = max(1, min(5, int(np.random.normal(base_performance, 0.7))))
                    elif 'time' in kpi_key.lower() or 'timeliness' in kpi_key.lower():
                        # For time-based metrics
                        score[kpi_key] = max(1, min(5, int(np.random.normal(base_performance, 0.6))))
                    elif 'leakage' in kpi_key.lower() or 'rework' in kpi_key.lower():
                        # For negative metrics (lower is better), invert the score
                        raw_score = max(1, min(5, int(np.random.normal(base_performance, 0.8))))
                        score[kpi_key] = 6 - raw_score  # Invert: 1->5, 2->4, 3->3, 4->2, 5->1
                    else:
                        # Default scoring
                        score[kpi_key] = max(1, min(5, int(np.random.normal(base_performance, 0.7))))
            else:
                # For roles without specific KPIs, use generic performance metrics
                score.update({
                    'goal_achievement_ratio': max(1, min(5, int(np.random.normal(base_performance, 0.8)))),
                    'quality_of_deliverables': max(1, min(5, int(np.random.normal(base_performance, 0.6)))),
                    'impact_on_org_team_goals': random.choices([1, 3, 5], weights=[0.2, 0.5, 0.3])[0],
                    'deadlines_met': max(1, min(5, int(np.random.normal(base_performance, 0.7)))),
                    'stakeholder_satisfaction': max(1, min(5, int(np.random.normal(base_performance, 0.6))))
                })
            
            kpi_scores.append(score)
        
        return kpi_scores
    
    def generate_skill_development_scores(self):
        """Generate Skill & Knowledge Development category scores"""
        scores = []
        
        for i in range(self.num_employees):
            # Some employees are more learning-oriented
            learning_oriented = random.random() < 0.3
            
            score = {
                'employee_id': f'EMP{str(i+1).zfill(4)}',
                'certifications_completed': random.choices([0, 3, 5], weights=[0.6, 0.3, 0.1])[0],
                'online_courses_attended': random.randint(0, 5),
                'training_hours_logged': random.randint(0, 5),
                'knowledge_contributions': random.choices([0, 1, 3, 5], weights=[0.4, 0.3, 0.2, 0.1])[0],
                'hackathon_participation': random.choices([0, 5], weights=[0.8, 0.2])[0],
                'innovation_submissions': random.choices([0, 1, 3, 5], weights=[0.7, 0.15, 0.1, 0.05])[0]
            }
            
            # Boost scores for learning-oriented employees
            if learning_oriented:
                score['certifications_completed'] = min(5, score['certifications_completed'] + 2)
                score['online_courses_attended'] = min(5, score['online_courses_attended'] + 2)
                score['training_hours_logged'] = min(5, score['training_hours_logged'] + 2)
            
            scores.append(score)
        
        return scores
    
    def generate_collaboration_scores(self):
        """Generate Collaboration & Communication category scores"""
        scores = []
        
        for i in range(self.num_employees):
            base_collaboration = random.uniform(2.5, 4.5)
            
            score = {
                'employee_id': f'EMP{str(i+1).zfill(4)}',
                'peer_review_rating': max(1, min(5, int(np.random.normal(base_collaboration, 0.7)))),
                'manager_feedback': max(1, min(5, int(np.random.normal(base_collaboration, 0.6)))),
                'meeting_participation_rate': max(1, min(5, int(np.random.normal(base_collaboration, 0.8)))),
                'communication_effectiveness': max(1, min(5, int(np.random.normal(base_collaboration, 0.6)))),
                'conflict_resolution': random.choices([1, 3, 5], weights=[0.1, 0.7, 0.2])[0],
                'mentorship_participation': random.choices([0, 5], weights=[0.7, 0.3])[0],
                'client_communication': max(1, min(5, int(np.random.normal(base_collaboration, 0.7))))
            }
            scores.append(score)
        
        return scores
    
    def generate_adaptability_scores(self):
        """Generate Adaptability & Growth Potential category scores"""
        scores = []
        
        for i in range(self.num_employees):
            base_adaptability = random.uniform(2.5, 4.5)
            
            score = {
                'employee_id': f'EMP{str(i+1).zfill(4)}',
                'response_to_change': max(1, min(5, int(np.random.normal(base_adaptability, 0.8)))),
                'initiative_in_projects': max(1, min(5, int(np.random.normal(base_adaptability, 0.7)))),
                'adaptability_to_change': max(1, min(5, int(np.random.normal(base_adaptability, 0.6)))),
                'promotion_recommendation': max(1, min(5, int(np.random.normal(base_adaptability, 0.9)))),
                'retention_suggestion': random.choices([1, 3, 5], weights=[0.1, 0.2, 0.7])[0],
                'leadership_score': max(1, min(5, int(np.random.normal(base_adaptability, 0.8)))),
                'stress_load_tolerance': random.choices([1, 3, 5], weights=[0.1, 0.3, 0.6])[0]
            }
            scores.append(score)
        
        return scores
    
    def generate_integrity_feedback_scores(self):
        """Generate Workplace Integrity & Feedback category scores"""
        scores = []
        
        for i in range(self.num_employees):
            score = {
                'employee_id': f'EMP{str(i+1).zfill(4)}',
                'special_recognitions': random.choices([0, 1, 2, 3], weights=[0.6, 0.25, 0.1, 0.05])[0],
                'hr_warnings': random.choices([0, 1, 2], weights=[0.85, 0.12, 0.03])[0],
                'peer_complaints': random.choices([0, 1, 2], weights=[0.9, 0.08, 0.02])[0],
                'recognition_received': random.choices([1, 3, 5], weights=[0.3, 0.5, 0.2])[0],
                'policy_compliance': random.choices([1, 3, 5], weights=[0.05, 0.15, 0.8])[0],
                'ethics_confidentiality': random.choices([1, 3, 5], weights=[0.02, 0.08, 0.9])[0]
            }
            scores.append(score)
        
        return scores
    
    def generate_historical_progress_scores(self):
        """Generate Historical Progress category scores"""
        scores = []
        
        for i in range(self.num_employees):
            experience_years = random.uniform(1, 10)
            
            score = {
                'employee_id': f'EMP{str(i+1).zfill(4)}',
                'total_experience_score': min(5, max(2, int(experience_years / 2) + 1)),  # Fixed missing closing parenthesis
                'internal_transfers': random.choices([3, 4, 5], weights=[0.6, 0.3, 0.1])[0],
                'promotions_achieved': random.choices([0, 1, 2, 3], weights=[0.4, 0.4, 0.15, 0.05])[0],
                'projects_handled': random.randint(1, 5),
                'past_ratings_history': max(1, min(5, int(np.random.normal(3.5, 0.8)))),
                'score_delta': random.choices([1, 3, 5], weights=[0.2, 0.6, 0.2])[0]
            }
            scores.append(score)
        
        return scores
    
    def _generate_feedback(self, employee, perf_level, feedback_type):
        """Generate dynamic feedback based on performance level and type"""
        adj = random.choice(self.feedback_templates['performance_adjectives'].get(perf_level, ['good']))
        name = employee['name']
        designation = employee['designation']
        department = employee['department']
        
        feedback_parts = []
        
        # Opening statement
        if feedback_type == 'manager':
            openings = [
                f"{name} has demonstrated {adj} performance this quarter.",
                f"In my assessment, {name} has shown {adj} work as a {designation}.",
                f"Overall, {name}'s performance has been {adj} during this review period."
            ]
        else:  # peer
            openings = [
                f"Working with {name} has been a {adj} experience.",
                f"{name} brings {adj} contributions to our team.",
                f"As a colleague, I find {name} to be {adj} to work with."
            ]
        feedback_parts.append(random.choice(openings))
        
        # Add strengths
        if perf_level in ['excellent', 'very good', 'good']:
            strength_categories = random.sample(
                list(self.feedback_templates['strengths'].keys()), 
                min(2, len(self.feedback_templates['strengths']))
            )
            for category in strength_categories:
                strength = random.choice(self.feedback_templates['strengths'][category])
                if random.random() < 0.7:  # 70% chance to include each strength
                    feedback_parts.append(f"They demonstrate {strength}.")
        
        # Add achievements for good performers
        if perf_level in ['excellent', 'very good'] and random.random() < 0.6:
            achievement_type = random.choice(list(self.feedback_templates['achievements'].keys()))
            achievement = random.choice(self.feedback_templates['achievements'][achievement_type])
            feedback_parts.append(f"Notably, they {achievement}.")
        
        # Add improvement areas for average/poor performers
        if perf_level in ['average', 'poor'] or (perf_level == 'good' and random.random() < 0.4):
            improvement_area = random.choice(list(self.feedback_templates['improvement_areas'].keys()))
            improvement = random.choice(self.feedback_templates['improvement_areas'][improvement_area])
            feedback_parts.append(f"Area for improvement: {improvement}.")
        
        # Add development suggestions
        if perf_level in ['excellent', 'very good', 'good'] and random.random() < 0.5:
            suggestion_type = random.choice(list(self.feedback_templates['development_suggestions'].keys()))
            suggestion = random.choice(self.feedback_templates['development_suggestions'][suggestion_type])
            feedback_parts.append(f"Development suggestion: {suggestion}.")
        
        # Add department-specific note
        if random.random() < 0.3:
            dept_notes = {
                'Engineering': "They contribute valuable technical expertise to the team.",
                'Sales': "Maintains strong client relationships and follows up consistently.",
                'Marketing': "Shows creativity in campaign development and execution.",
                'HR': "Demonstrates strong interpersonal skills and employee focus.",
                'Finance': "Maintains high accuracy in financial reporting and analysis."
            }
            if department in dept_notes:
                feedback_parts.append(dept_notes[department])
        
        return ' '.join(feedback_parts)
    
    def _generate_hr_notes(self, employee, integrity_score):
        """Generate HR notes based on integrity score"""
        name = employee['name']
        
        base_notes = [
            f"{name} maintains professional conduct and follows company policies.",
            f"{name} actively participates in company initiatives and team activities.",
            f"{name} demonstrates good work-life balance and time management.",
            f"{name} shows commitment to continuous learning and development.",
            f"{name} contributes positively to team culture and collaboration."
        ]
        
        hr_note = random.choice(base_notes)
        
        if integrity_score >= 4.5:
            hr_note += " Exemplary adherence to company values and ethics."
        elif integrity_score >= 4.0:
            hr_note += " Consistently demonstrates high ethical standards."
        elif integrity_score < 3.0:
            hr_note += " Some areas for improvement in policy compliance noted."
        
        # Add random HR note elements
        if random.random() < 0.4:
            extras = [
                " No disciplinary actions on record.",
                " Attendance record is excellent.",
                " Participates in volunteer programs.",
                " Received positive feedback from multiple sources.",
                " Completed all mandatory training on time."
            ]
            hr_note += random.choice(extras)
        
        return hr_note
    
    def _generate_client_feedback(self, employee, perf_level):
        """Generate client feedback for client-facing roles"""
        name = employee['name']
        designation = employee['designation']
        
        if perf_level in ['excellent', 'very good']:
            feedback_options = [
                f"Client reported being extremely satisfied with {name}'s work.",
                f"{name} received glowing feedback from multiple clients.",
                f"Client specifically mentioned {name}'s professionalism and expertise.",
                f"{name} consistently exceeds client expectations in deliverables.",
                f"Client requested {name} specifically for their next project."
            ]
        elif perf_level == 'good':
            feedback_options = [
                f"Client provided positive feedback about {name}'s work.",
                f"{name} maintains good client relationships and communication.",
                f"Client satisfied with {name}'s deliverables and responsiveness.",
                f"{name} handles client requests professionally and efficiently.",
                f"Client feedback indicates satisfaction with {name}'s performance."
            ]
        else:
            feedback_options = [
                f"Some client feedback suggests room for improvement in communication.",
                f"Client noted occasional delays in response times from {name}.",
                f"Client requested clearer documentation from {name} on some deliverables.",
                f"Some client feedback indicates need for more proactive updates.",
                f"Client satisfied overall but noted areas for improvement."
            ]
        
        return random.choice(feedback_options)
    
    def generate_comments_feedback(self, employees_data, category_scores):
        """Generate dynamic, personalized feedback comments based on employee performance"""
        feedback_data = []
        
        for i, employee in enumerate(employees_data):
            emp_id = employee['employee_id']
            overall_score = category_scores[i]['overall_weighted_score']
            designation = employee['designation']
            department = employee['department']
            
            # Determine performance level
            if overall_score >= 4.5:
                perf_level = 'excellent'
            elif overall_score >= 4.0:
                perf_level = 'very good'
            elif overall_score >= 3.0:
                perf_level = 'good'
            elif overall_score >= 2.5:
                perf_level = 'average'
            else:
                perf_level = 'poor'
            
            # Generate manager feedback
            manager_feedback = self._generate_feedback(employee, perf_level, 'manager')
            
            # Generate HR notes
            hr_notes = self._generate_hr_notes(employee, category_scores[i]['integrity_feedback_score'])
            
            # Generate peer reviews
            peer_reviews = self._generate_feedback(employee, perf_level, 'peer')
            
            # Generate client feedback if applicable
            client_facing_roles = ['Sales Executive', 'Product Manager', 'Marketing Specialist', 'HR Executive']
            if designation in client_facing_roles:
                client_feedback = self._generate_client_feedback(employee, perf_level)
            else:
                client_feedback = "N/A - Role does not involve direct client interaction"
            
            feedback = {
                'employee_id': emp_id,
                'manager_comments': manager_feedback,
                'hr_notes': hr_notes,
                'peer_reviews': peer_reviews,
                'client_feedback': client_feedback
            }
            feedback_data.append(feedback)
        
        return feedback_data
    
    def calculate_category_scores(self, effort_scores, kpi_scores, skill_scores, 
                                 collaboration_scores, adaptability_scores, integrity_scores, 
                                 historical_scores):
        """Calculate weighted category scores"""
        category_scores = []
        
        for i in range(self.num_employees):
            emp_id = f'EMP{str(i+1).zfill(4)}'
            
            # Calculate average for each category
            effort_avg = np.mean([
                effort_scores[i]['avg_hours_logged_vs_team'],
                effort_scores[i]['task_completion_ratio'],
                effort_scores[i]['active_workdays'],
                effort_scores[i]['voluntary_contributions'],
                effort_scores[i]['burnout_risk'],
                effort_scores[i]['responsiveness'],
                effort_scores[i]['meeting_participation'],
                effort_scores[i]['task_ownership'],
                effort_scores[i]['adherence_to_deadlines'],
                effort_scores[i]['work_quality_consistency']
            ])
            
            # Calculate KPI average (role-specific performance)
            kpi_values = [v for k, v in kpi_scores[i].items() if k != 'employee_id']
            kpi_avg = np.mean(kpi_values) if kpi_values else 3.0
            
            skill_avg = np.mean([v for v in skill_scores[i].values() if v != emp_id])
            
            collaboration_avg = np.mean([v for v in collaboration_scores[i].values() if v != emp_id])
            
            adaptability_avg = np.mean([v for v in adaptability_scores[i].values() if v != emp_id])
            
            # For integrity, handle positive/negative scoring
            integrity_base = np.mean([
                integrity_scores[i]['recognition_received'],
                integrity_scores[i]['policy_compliance'],
                integrity_scores[i]['ethics_confidentiality']
            ])
            integrity_bonus = integrity_scores[i]['special_recognitions']
            integrity_penalty = integrity_scores[i]['hr_warnings'] + integrity_scores[i]['peer_complaints']
            integrity_avg = max(1, min(5, integrity_base + integrity_bonus - integrity_penalty))
            
            historical_avg = np.mean([v for v in historical_scores[i].values() if v != emp_id])
            
            # Calculate weighted overall score
            weights = {
                'effort': 0.25,
                'kpi': 0.20,  # Role-specific KPIs
                'skill': 0.15,
                'collaboration': 0.15,
                'adaptability': 0.10,
                'integrity': 0.10,
                'historical': 0.05
            }
            
            overall_score = (
                effort_avg * weights['effort'] +
                kpi_avg * weights['kpi'] +
                skill_avg * weights['skill'] +
                collaboration_avg * weights['collaboration'] +
                adaptability_avg * weights['adaptability'] +
                integrity_avg * weights['integrity'] +
                historical_avg * weights['historical']
            )
            
            category_score = {
                'employee_id': emp_id,
                'effort_engagement_score': round(effort_avg, 2),
                'role_specific_kpi_score': round(kpi_avg, 2),
                'skill_development_score': round(skill_avg, 2),
                'collaboration_communication_score': round(collaboration_avg, 2),
                'adaptability_growth_score': round(adaptability_avg, 2),
                'integrity_feedback_score': round(integrity_avg, 2),
                'historical_progress_score': round(historical_avg, 2),
                'overall_weighted_score': round(overall_score, 2)
            }
            
            category_scores.append(category_score)
        
        return category_scores
    
    def generate_complete_dataset(self):
        """Generate the complete EvalMate dataset"""
        print("Generating employee basic information...")
        basic_info = self.generate_employee_basic_info()
        
        print("Generating effort & engagement scores...")
        effort_scores = self.generate_effort_engagement_scores()
        
        print("Generating role-specific KPI scores...")
        kpi_scores = self.generate_role_specific_kpis(basic_info)
        
        print("Generating skill development scores...")
        skill_scores = self.generate_skill_development_scores()
        
        print("Generating collaboration scores...")
        collaboration_scores = self.generate_collaboration_scores()
        
        print("Generating adaptability scores...")
        adaptability_scores = self.generate_adaptability_scores()
        
        print("Generating integrity & feedback scores...")
        integrity_scores = self.generate_integrity_feedback_scores()
        
        print("Generating historical progress scores...")
        historical_scores = self.generate_historical_progress_scores()
        
        print("Calculating category scores...")
        category_scores = self.calculate_category_scores(
            effort_scores, kpi_scores, skill_scores,
            collaboration_scores, adaptability_scores, integrity_scores, historical_scores
        )
        
        print("Generating comments & feedback...")
        feedback_data = self.generate_comments_feedback(basic_info, category_scores)
        
        # Convert to DataFrames
        df_basic = pd.DataFrame(basic_info)
        df_effort = pd.DataFrame(effort_scores)
        df_kpi = pd.DataFrame(kpi_scores)
        df_skill = pd.DataFrame(skill_scores)
        df_collaboration = pd.DataFrame(collaboration_scores)
        df_adaptability = pd.DataFrame(adaptability_scores)
        df_integrity = pd.DataFrame(integrity_scores)
        df_historical = pd.DataFrame(historical_scores)
        df_feedback = pd.DataFrame(feedback_data)
        df_category = pd.DataFrame(category_scores)
        
        # Merge all dataframes into one comprehensive dataset
        final_df = df_basic
        for df in [df_effort, df_kpi, df_skill, df_collaboration, 
                  df_adaptability, df_integrity, df_historical, df_feedback, df_category]:
            final_df = final_df.merge(df, on='employee_id', how='left')
            
        return final_df

# Generate the dataset
if __name__ == "__main__":
    generator = EvalMateDatasetGenerator(num_employees=10000)
    final_dataset = generator.generate_complete_dataset()
    
    print(f"\nDataset generated successfully!")
    print(f"Total employees: {len(final_dataset)}")
    print(f"Total columns: {len(final_dataset.columns)}")
    
    # Save the complete dataset to CSV file
    final_dataset.to_csv('evalmate_complete_dataset.csv', index=False)
    print(f"Dataset saved to evalmate_complete_dataset.csv")