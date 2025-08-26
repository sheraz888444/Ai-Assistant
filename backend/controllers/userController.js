import User from "../models/userModel.js";

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: "get current user error" });
    }
};

export const updateAssistant = async (req, res) => {
    console.log("Request body:", req.body);
    try {
        const userId = req.userId;
        const { assistantName } = req.body;

        console.log("User ID:", userId);
        console.log("Assistant Name:", assistantName);

        // Read existing to compute completion correctly
        const existing = await User.findById(userId).select('-password');
        if (!existing) {
            return res.status(404).json({ message: "User not found" });
        }

        const updateData = {};

        if (assistantName) {
            updateData.assistantName = assistantName;
        }

        // Only mark setup complete if we have both name and image
        const hasName = Boolean(assistantName || existing.assistantName);
        const hasImage = Boolean(existing.imagePath);
        if (hasName && hasImage) {
            updateData.hasCompletedSetup = true;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password');

        return res.status(200).json({
            message: "Assistant updated successfully",
            user
        });
    } catch (error) {
        console.error("Update assistant error:", error);
        return res.status(500).json({ message: "Update assistant error" });
    }
}

// Update profile: set assistant name and/or image path; mark setup complete when both are present
export const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { assistantName } = req.body;
        const file = req.file;

        // Fetch existing to determine completion state across updates
        const existing = await User.findById(userId).select('-password');
        if (!existing) {
            return res.status(404).json({ message: "User not found" });
        }

        const updateData = {};

        if (assistantName) {
            updateData.assistantName = assistantName;
        }

        if (file) {
            // store only relative path for static serving
            updateData.imagePath = `/uploads/${file.filename}`;
        }

        // Determine setup completion (needs both name and image)
        const hasName = Boolean(assistantName || existing.assistantName);
        const hasImage = Boolean(file || existing.imagePath);
        if (hasName && hasImage) {
            updateData.hasCompletedSetup = true;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password');

        return res.status(200).json({
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ message: "Update profile error" });
    }
}

// Add command to user history
export const addCommandToHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const { command, response } = req.body;
        
        const user = await User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    history: {
                        command,
                        response,
                        timestamp: new Date()
                    }
                }
            },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        return res.status(200).json({ 
            message: "Command added to history", 
            user 
        });
    } catch (error) {
        console.error("Add command error:", error);
        return res.status(500).json({ message: "Add command error" });
    }
};

// Get user command history
export const getCommandHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select('history');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        return res.status(200).json({ 
            history: user.history 
        });
    } catch (error) {
        console.error("Get history error:", error);
        return res.status(500).json({ message: "Get history error" });
    }
};
