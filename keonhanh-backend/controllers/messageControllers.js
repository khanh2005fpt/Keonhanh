import Message from "../models/Message.js";

export const getTeamMessages = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const messages = await Message.find({ team: teamId })
      .populate("sender", "username fullName avatar email")
      .sort({ createdAt: 1 });
      
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error while fetching messages" });
  }
};
