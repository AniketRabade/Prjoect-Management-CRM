//projectController.js
import Project from '../models/Project.js';
// Get all projects
export const getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('createdBy', 'name email')
            .populate('projectManager', 'name email')
            .populate('teamMembers', 'name email')
            .sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get a single project by ID
export const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('projectManager', 'name email')
            .populate('teamMembers', 'name email');
        if (!project) return res.status(404).json({ message: 'Project not found' });
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new project
export const createProject = async (req, res) => {
    const project = new Project(req.body);
    try {
        // i want save save req.user as createdBy
        const userId = req.user._id; // Assuming req.user is set by the auth middleware
        const newProject=new Project({
            ...req.body,
            createdBy: userId // Set the createdBy field to the user's ID
        });

        // Save the project with the createdBy field
        await newProject.save();
    
        res.status(201).json(newProject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update a project
export const updateProject = async (req, res) => {
    try {
        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedProject) return res.status(404).json({ message: 'Project not found' });
        res.json(updatedProject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a project
export const deleteProject = async (req, res) => {
    try {
        const deletedProject = await Project.findByIdAndDelete(req.params.id);
        if (!deletedProject) return res.status(404).json({ message: 'Project not found' });
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};




