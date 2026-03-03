# ER Diagram – UniMetrics (Multi-Tenant, Multi-Factor Academic Intelligence)

```mermaid
erDiagram

University ||--o{ User : "has"
University ||--o{ Department : "contains"
University ||--o{ Exam : "conducts"

Department ||--o{ Course : "offers"

User ||--o{ Grade : "receives"
User ||--o| RiskProfile : "has one"
User ||--o{ Alert : "generates"

Course ||--o{ Grade : "assessed in"
Exam ||--o{ Grade : "part of"

University {
  int id PK
  string name
  string address
  datetime createdAt
  datetime updatedAt
}

User {
  int id PK
  string name
  string email UK
  string password
  string role
  int universityId FK
  datetime createdAt
  datetime updatedAt
}

Department {
  int id PK
  string name
  int universityId FK
}

Course {
  int id PK
  string name
  int totalAssignments
  int departmentId FK
}

Exam {
  int id PK
  int semester
  int universityId FK
}

Grade {
  int id PK
  float marks
  float quizScore
  float labScore
  int assignmentsCompleted
  float attendancePercent
  int userId FK
  int courseId FK
  int examId FK
}

RiskProfile {
  int id PK
  float riskScore
  string riskLevel
  int userId FK
}

Alert {
  int id PK
  string message
  string severity
  boolean isRead
  int userId FK
  datetime createdAt
}
```

## Risk Score Computation

| Factor | Weight | Source |
|---|---|---|
| Exam / Mid-term | 35% | `Grade.marks` |
| Quiz Score | 15% | `Grade.quizScore` |
| Lab / Practical | 15% | `Grade.labScore` |
| Assignments | 20% | `Grade.assignmentsCompleted / Course.totalAssignments × 100` |
| Attendance | 15% | `Grade.attendancePercent` |

**Composite ≥ 70 → LOW | 50–69 → MEDIUM | < 50 → HIGH**
