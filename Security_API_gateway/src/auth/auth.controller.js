const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

// ================= REGISTER =================
exports.register = async (req, res) => {
    try {
        const { name, email, password, roleId } = req.body;

        // Validate input
        if (!name || !email || !password || !roleId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email already registered."
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                roleId: Number(roleId)
            }
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully.",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                roleId: user.roleId
            }
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// ================= LOGIN =================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password."
            });
        }

        // Generate JWT Access Token
        const accessToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                roleId: user.roleId
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );
const refreshToken = jwt.sign(
    {
        id: user.id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: "7d"
    }
);
       return res.status(200).json({
    success: true,
    message: "Login successful.",
    accessToken,
    refreshToken,
    user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId
    }
});
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};
exports.refreshToken = async (req, res) => {

    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: "Refresh token required."
        });
    }

    try {

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const accessToken = jwt.sign(
            {
                id: decoded.id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        return res.json({
            success: true,
            accessToken
        });

} catch (err) {

    console.error(err);

    return res.status(403).json({
        success: false,
        message: "Invalid refresh token."
    });

    }

};