-- Create sprints table
CREATE TABLE sprints (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    state VARCHAR(20) NOT NULL CHECK (state IN ('Planned', 'Active', 'Completed')),
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (start_date < end_date)
);

-- Create index on project_id for faster lookups
CREATE INDEX idx_sprints_project_id ON sprints(project_id);
