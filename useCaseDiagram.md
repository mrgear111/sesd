# Use Case Diagram

```mermaid
usecaseDiagram
    actor User
    actor Admin

    package "AgileFlow System" {
        usecase "Login / Register" as UC1
        usecase "Manage User Profile" as UC2
        usecase "Create Project" as UC3
        usecase "Manage Project Settings" as UC4
        usecase "Invite Members" as UC5
        usecase "Create Task" as UC6
        usecase "Edit Task Details" as UC7
        usecase "Move Task" as UC8
        usecase "View Dashboard" as UC9
        usecase "Add Comments" as UC10
    }

    User --> UC1
    User --> UC2
    User --> UC9
    User --> UC6
    User --> UC7
    User --> UC8
    User --> UC10

    Admin --> UC3
    Admin --> UC4
    Admin --> UC5

    User <|-- Admin
```
