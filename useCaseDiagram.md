# Use Case Diagram – UniMetrics

@startuml

actor SuperAdmin
actor UniversityAdmin
actor Faculty
actor Student

SuperAdmin --> (Register University)
SuperAdmin --> (Manage Universities)

UniversityAdmin --> (Manage Departments)
UniversityAdmin --> (Manage Users)
UniversityAdmin --> (View Institutional Analytics)

Faculty --> (Upload Exam Scores)
Faculty --> (View Class Analytics)
Faculty --> (View Risk Alerts)

Student --> (View Performance)
Student --> (View Risk Status)
Student --> (View Attendance)

(Upload Exam Scores) --> (Analyze Performance)
(Analyze Performance) --> (Calculate CGPA)
(Calculate CGPA) --> (Evaluate Risk)
(Evaluate Risk) --> (Generate Alert)

@enduml
