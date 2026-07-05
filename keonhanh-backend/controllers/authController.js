import jwt from "jsonwebtoken";
import User from "../models/User.js";
import UserProfile from "../models/UserProfile.js";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Sai tài khoản",
      });
    }

    // ❗ nếu bạn có hash password thì check ở đây
    // const isMatch = await bcrypt.compare(password, user.password)

    const profile = await UserProfile.findOne({ userId: user._id });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token: token, // 🔥 BẮT BUỘC
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        profileId: profile?._id || null,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};