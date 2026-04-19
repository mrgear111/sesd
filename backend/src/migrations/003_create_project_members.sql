-- Create project_members table
CREATE TABLE project_members (
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'PM', 'Dev', 'QA', 'Viewer')),
    PRIMARY KEY (project_id, user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
