-- Create workflows table
CREATE TABLE workflows (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sequence_order INTEGER NOT NULL,
    UNIQUE (project_id, sequence_order)
);

-- Create index on project_id for faster lookups
CREATE INDEX idx_workflows_project_id ON workflows(project_id);
