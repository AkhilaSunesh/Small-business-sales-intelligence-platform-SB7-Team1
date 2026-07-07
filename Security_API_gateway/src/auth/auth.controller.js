const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
    try {
        const { name, email, password, roleId } = req.body;

        // Check required fields
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
                roleId
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

exports.login = async (req, res) => {
    return res.json({
        success: true,
        message: "Login API coming in next step."
    });
};